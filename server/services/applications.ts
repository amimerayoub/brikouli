import type { ApiResult, JobSeekerApplication } from "@shared/brikouli.types";
import { applicationListSchema, applicationSchema } from "../schemas/domain";
import { getJobSeekerGig } from "./gigs";
import { createSupabaseForAccessToken, requireRole, verifyActor } from "./supabase";
import { isAdmin, isJobSeeker } from "./roles";

export function applicationCreateFailure(errorCode?: string): ApiResult<never> {
  if (errorCode === "23505") return { success: false, code: "APPLICATION_EXISTS", message: "سبق أن تقدمت إلى هذه الفرصة." };
  return { success: false, code: "APPLICATION_CREATE_FAILED", message: "تعذر إرسال طلبك." };
}

export async function applyToGig(accessToken: string, input: unknown): Promise<ApiResult<{ id: string }>> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "معرّف الفرصة غير صالح." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isJobSeeker(actor.data) && !isAdmin(actor.data)) return { success: false, code: "FORBIDDEN", message: "إرسال الطلبات متاح للباحثين عن فرص فقط." };
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("applications").insert({ gig_id: parsed.data.gigId, applicant_id: actor.data.profile.id }).select("id").single();
  if (error || !data) return applicationCreateFailure(error?.code);
  return { success: true, data: { id: String(data.id) } };
}

export async function listMyApplications(accessToken: string, input: unknown): Promise<ApiResult<JobSeekerApplication[]>> {
  const parsed = applicationListSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "حالة الطلب غير صالحة." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isJobSeeker(actor.data) && !isAdmin(actor.data)) return { success: false, code: "FORBIDDEN", message: "هذه الميزة متاحة للباحثين عن فرص فقط." };
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  let query = client.from("applications").select("id, gig_id, status, created_at").eq("applicant_id", actor.data.profile.id).order("created_at", { ascending: false });
  if (parsed.data.status) query = query.eq("status", parsed.data.status);
  const { data, error } = await query;
  if (error) return { success: false, code: "APPLICATIONS_LIST_FAILED", message: "تعذر تحميل طلباتك." };
  const applications = await Promise.all((data ?? []).map(async row => {
    const gig = await getJobSeekerGig({ gigId: row.gig_id });
    return { id: String(row.id), gigId: String(row.gig_id), status: String(row.status) as JobSeekerApplication["status"], createdAt: String(row.created_at), gig: gig.success ? gig.data : null };
  }));
  return { success: true, data: applications };
}
