import type { ApiResult } from "@shared/brikouli.types";
import { z } from "zod";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";

const reportSchema = z.object({ targetType: z.enum(["profile", "gig", "application", "rating"]), targetId: z.string().uuid(), reason: z.string().trim().min(4).max(1500) });
export async function createReport(accessToken: string, input: unknown): Promise<ApiResult<{ id: string }>> { const parsed = reportSchema.safeParse(input); if (!parsed.success) return { success: false, code: "VALIDATION_ERROR", message: "بيانات البلاغ غير صالحة." }; const actor = await verifyActor(accessToken); if (!actor.success) return actor; const client = createSupabaseForAccessToken(accessToken); if ("success" in client) return client; const { data, error } = await client.from("reports").insert({ reporter_id: actor.data.profile.id, target_type: parsed.data.targetType, target_id: parsed.data.targetId, reason: parsed.data.reason }).select("id").single(); return error || !data ? { success: false, code: "REPORT_CREATE_FAILED", message: "تعذر إرسال البلاغ." } : { success: true, data: { id: String(data.id) } }; }
