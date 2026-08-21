import type { ApiResult, Gig, JobSeekerGig, NearbyGig } from "@shared/brikouli.types";
import { gigSchema, jobSeekerGigQuerySchema, nearbyGigQuerySchema, savedGigSchema } from "../schemas/domain";
import { createPublicSupabase, createSupabaseForAccessToken, verifyActor } from "./supabase";
import { isAdmin, isEmployer } from "./roles";

function mapGig(row: Record<string, unknown>): Gig {
  return {
    id: String(row.id),
    employerId: String(row.employer_id),
    title: String(row.title),
    description: String(row.description),
    category: String(row.category),
    city: String(row.city),
    neighborhood: row.neighborhood ? String(row.neighborhood) : null,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    payment: Number(row.payment),
    paymentType: String(row.payment_type) as Gig["paymentType"],
    duration: String(row.duration),
    urgent: Boolean(row.urgent),
    status: String(row.status) as Gig["status"],
    createdAt: String(row.created_at),
  };
}

function mapNearbyGig(row: Record<string, unknown>): NearbyGig {
  return { ...mapGig(row), employerName: String(row.employer_name ?? "صاحب عمل محلي"), distanceMeters: Number(row.distance_meters) };
}

export function mapJobSeekerGig(row: Record<string, unknown>): JobSeekerGig {
  return { ...mapGig(row), employerName: String(row.employer_name ?? "صاحب عمل محلي"), employerAvatarUrl: row.employer_avatar_url ? String(row.employer_avatar_url) : null };
}

export async function listActiveGigs(): Promise<ApiResult<Gig[]>> {
  const client = createPublicSupabase();
  if ("success" in client) return client;
  const { data, error } = await client.from("gigs").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (error) return { success: false, code: "GIG_LIST_FAILED", message: "تعذر تحميل الفرص." };
  return { success: true, data: (data ?? []).map(mapGig) };
}

export async function getNearbyGigs(input: unknown): Promise<ApiResult<NearbyGig[]>> {
  const parsed = nearbyGigQuerySchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "LOCATION_QUERY_INVALID", message: parsed.error.issues[0]?.message ?? "بيانات الموقع غير صالحة." };
  const client = createPublicSupabase();
  if ("success" in client) return client;
  const query = parsed.data;
  const { data, error } = await client.rpc("get_nearby_gigs", { p_lat: query.latitude, p_lng: query.longitude, p_radius_km: query.radiusKm, p_limit: query.limit, p_sort: query.sort, p_category: query.category ?? null, p_urgent_only: query.urgentOnly, p_min_payment: query.minPayment ?? null, p_max_payment: query.maxPayment ?? null });
  if (error) return { success: false, code: "NEARBY_GIGS_FAILED", message: "تعذر تحميل الفرص القريبة." };
  return { success: true, data: (data ?? []).map((row: Record<string, unknown>) => mapNearbyGig(row)) };
}

export async function listJobSeekerGigs(input: unknown): Promise<ApiResult<JobSeekerGig[]>> {
  const parsed = jobSeekerGigQuerySchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "GIG_QUERY_INVALID", message: "معايير البحث غير صالحة." };
  const client = createPublicSupabase();
  if ("success" in client) return client;
  const query = parsed.data;
  const { data, error } = await client.rpc("list_job_seeker_gigs", { p_query: query.query || null, p_category: query.category ?? null, p_urgent_only: query.urgentOnly, p_sort: query.sort, p_limit: query.limit });
  if (error) return { success: false, code: "GIG_LIST_FAILED", message: "تعذر تحميل الفرص." };
  return { success: true, data: (data ?? []).map((row: Record<string, unknown>) => mapJobSeekerGig(row)) };
}

export async function getJobSeekerGig(input: unknown): Promise<ApiResult<JobSeekerGig>> {
  const parsed = savedGigSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "GIG_ID_INVALID", message: "معرّف الفرصة غير صالح." };
  const client = createPublicSupabase();
  if ("success" in client) return client;
  const { data, error } = await client.rpc("get_job_seeker_gig", { p_gig_id: parsed.data.gigId }).maybeSingle();
  if (error) return { success: false, code: "GIG_DETAIL_FAILED", message: "تعذر تحميل تفاصيل الفرصة." };
  if (!data) return { success: false, code: "GIG_NOT_FOUND", message: "هذه الفرصة لم تعد متاحة." };
  return { success: true, data: mapJobSeekerGig(data as Record<string, unknown>) };
}

export async function createGig(accessToken: string, input: unknown): Promise<ApiResult<Gig>> {
  const parsed = gigSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "بيانات الفرصة غير صالحة." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isEmployer(actor.data) && !isAdmin(actor.data)) return { success: false, code: "FORBIDDEN", message: "إنشاء الفرص متاح لأصحاب الأعمال فقط." };
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("gigs").insert({ employer_id: actor.data.profile.id, title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, city: parsed.data.city, neighborhood: parsed.data.neighborhood ?? null, latitude: parsed.data.latitude ?? null, longitude: parsed.data.longitude ?? null, payment: parsed.data.payment, payment_type: parsed.data.paymentType, duration: parsed.data.duration, urgent: false, status: "draft" }).select("*").single();
  if (error || !data) return { success: false, code: "GIG_CREATE_FAILED", message: "تعذر إنشاء الفرصة." };
  return { success: true, data: mapGig(data) };
}
