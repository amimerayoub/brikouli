import type { ApiResult, BrikouliProfile } from "@shared/brikouli.types";
import { profileSchema } from "../schemas/domain";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";

export async function getCurrentProfile(accessToken: string): Promise<ApiResult<BrikouliProfile>> {
  const actor = await verifyActor(accessToken);
  return actor.success ? { success: true, data: actor.data.profile } : actor;
}

export async function updateCurrentProfile(accessToken: string, input: unknown): Promise<ApiResult<BrikouliProfile>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "بيانات الملف الشخصي غير صالحة." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data, error } = await client.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone ?? null, city: parsed.data.city ?? null, neighborhood: parsed.data.neighborhood ?? null, avatar_url: parsed.data.avatarUrl ?? null }).eq("id", actor.data.profile.id).select("*").single();
  if (error || !data) return { success: false, code: "PROFILE_UPDATE_FAILED", message: "تعذر حفظ الملف الشخصي." };
  return { success: true, data: { ...actor.data.profile, fullName: String(data.full_name), phone: data.phone, city: data.city, neighborhood: data.neighborhood, avatarUrl: data.avatar_url, updatedAt: String(data.updated_at) } };
}
