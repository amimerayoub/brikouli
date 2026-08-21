import type { ApiResult, SavedGig } from "@shared/brikouli.types";
import { savedGigSchema } from "../schemas/domain";
import { isAdmin, isJobSeeker } from "./roles";
import { mapJobSeekerGig } from "./gigs";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";

async function requireJobSeeker(accessToken: string) {
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  if (!isJobSeeker(actor.data) && !isAdmin(actor.data)) return { success: false as const, code: "FORBIDDEN", message: "هذه الميزة متاحة للباحثين عن فرص فقط." };
  return actor;
}

export async function saveGig(accessToken: string, input: unknown): Promise<ApiResult<{ gigId: string }>> {
  const parsed = savedGigSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "معرّف الفرصة غير صالح." };
  const actor = await requireJobSeeker(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { error } = await client.from("favorites").upsert({ user_id: actor.data.profile.id, gig_id: parsed.data.gigId }, { onConflict: "user_id,gig_id", ignoreDuplicates: true });
  if (error) return { success: false, code: "FAVORITE_SAVE_FAILED", message: "تعذر حفظ الفرصة." };
  return { success: true, data: { gigId: parsed.data.gigId } };
}

export async function unsaveGig(accessToken: string, input: unknown): Promise<ApiResult<{ gigId: string }>> {
  const parsed = savedGigSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "معرّف الفرصة غير صالح." };
  const actor = await requireJobSeeker(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { error } = await client.from("favorites").delete().eq("user_id", actor.data.profile.id).eq("gig_id", parsed.data.gigId);
  if (error) return { success: false, code: "FAVORITE_REMOVE_FAILED", message: "تعذر إزالة الفرصة المحفوظة." };
  return { success: true, data: { gigId: parsed.data.gigId } };
}

export async function listSavedGigs(accessToken: string): Promise<ApiResult<SavedGig[]>> {
  const actor = await requireJobSeeker(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.rpc("list_saved_job_seeker_gigs");
  if (error) return { success: false, code: "FAVORITES_LIST_FAILED", message: "تعذر تحميل الفرص المحفوظة." };
  return { success: true, data: (data ?? []).map((row: Record<string, unknown>) => ({ ...mapJobSeekerGig(row), savedAt: String(row.saved_at) })) };
}

export async function listSavedGigIds(accessToken: string): Promise<ApiResult<string[]>> {
  const actor = await requireJobSeeker(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("favorites").select("gig_id").eq("user_id", actor.data.profile.id);
  if (error) return { success: false, code: "FAVORITES_LIST_FAILED", message: "تعذر تحميل الفرص المحفوظة." };
  return { success: true, data: (data ?? []).map(row => String(row.gig_id)) };
}
