import type { ApiResult, Gig } from "@shared/brikouli.types";
import { gigSchema } from "../schemas/domain";
import { createPublicSupabase, createSupabaseForAccessToken, requireRole, verifyActor } from "./supabase";
import { isAdmin, isEmployer } from "./roles";

function mapGig(row: Record<string, unknown>): Gig { return { id: String(row.id), employerId: String(row.employer_id), title: String(row.title), description: String(row.description), category: String(row.category), city: String(row.city), neighborhood: row.neighborhood ? String(row.neighborhood) : null, latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude), payment: Number(row.payment), paymentType: String(row.payment_type) as Gig["paymentType"], duration: String(row.duration), status: String(row.status) as Gig["status"], createdAt: String(row.created_at) }; }

export async function listActiveGigs(): Promise<ApiResult<Gig[]>> {
  const client = createPublicSupabase();
  if ("success" in client) return client;
  const { data, error } = await client.from("gigs").select("*").eq("status", "active").order("created_at", { ascending: false });
  if (error) return { success: false, code: "GIG_LIST_FAILED", message: "تعذر تحميل الفرص." };
  return { success: true, data: (data ?? []).map(mapGig) };
}

export async function createGig(accessToken: string, input: unknown): Promise<ApiResult<Gig>> {
  const parsed = gigSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "بيانات الفرصة غير صالحة." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isEmployer(actor.data) && !isAdmin(actor.data)) return { success: false, code: "FORBIDDEN", message: "إنشاء الفرص متاح لأصحاب الأعمال فقط." };
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("gigs").insert({ employer_id: actor.data.profile.id, title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, city: parsed.data.city, neighborhood: parsed.data.neighborhood ?? null, latitude: parsed.data.latitude ?? null, longitude: parsed.data.longitude ?? null, payment: parsed.data.payment, payment_type: parsed.data.paymentType, duration: parsed.data.duration, status: "draft" }).select("*").single();
  if (error || !data) return { success: false, code: "GIG_CREATE_FAILED", message: "تعذر إنشاء الفرصة." };
  return { success: true, data: mapGig(data) };
}
