import type { ApiResult } from "@shared/brikouli.types";
import { applicationSchema } from "../schemas/domain";
import { createSupabaseForAccessToken, requireRole, verifyActor } from "./supabase";
import { isAdmin, isJobSeeker } from "./roles";

export async function applyToGig(accessToken: string, input: unknown): Promise<ApiResult<{ id: string }>> {
  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "معرّف الفرصة غير صالح." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isJobSeeker(actor.data) && !isAdmin(actor.data)) return { success: false, code: "FORBIDDEN", message: "إرسال الطلبات متاح للباحثين عن فرص فقط." };
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("applications").insert({ gig_id: parsed.data.gigId, applicant_id: actor.data.profile.id }).select("id").single();
  if (error || !data) return { success: false, code: "APPLICATION_CREATE_FAILED", message: "تعذر إرسال طلبك." };
  return { success: true, data: { id: String(data.id) } };
}
