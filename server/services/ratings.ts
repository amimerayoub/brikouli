import type { ApiResult } from "@shared/brikouli.types";
import { z } from "zod";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";

const ratingSchema = z.object({ gigId: z.string().uuid(), toUser: z.string().uuid(), stars: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() });
export async function createRating(accessToken: string, input: unknown): Promise<ApiResult<{ id: string }>> { const parsed = ratingSchema.safeParse(input); if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "بيانات التقييم غير صالحة." }; const actor = await verifyActor(accessToken); if (!actor.success) return actor; const client = createSupabaseForAccessToken(accessToken); if ("success" in client) return client; const { data, error } = await client.from("ratings").insert({ gig_id: parsed.data.gigId, from_user: actor.data.profile.id, to_user: parsed.data.toUser, stars: parsed.data.stars, comment: parsed.data.comment ?? null }).select("id").single(); return error || !data ? { success: false, code: "RATING_CREATE_FAILED", message: "تعذر إضافة التقييم." } : { success: true, data: { id: String(data.id) } }; }
