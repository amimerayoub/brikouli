import type { ApiResult, RecommendedGig } from "@shared/brikouli.types";
import { createSupabaseForAccessToken, verifyActor } from "../../services/supabase";
import { mapJobSeekerGig } from "../../services/gigs";
import { scoreGigMatch } from "./matching";

export async function getRecommendedGigs(accessToken: string, limit = 8): Promise<ApiResult<RecommendedGig[]>> {
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data: preferenceRow, error: preferenceError } = await client.from("profiles").select("skills, availability, city").eq("id", actor.data.profile.id).single();
  if (preferenceError || !preferenceRow) return { success: false, code: "RECOMMENDATION_PROFILE_FAILED", message: "تعذر تجهيز تفضيلات التوصية." };
  const { data, error } = await client.rpc("list_job_seeker_gigs", { p_query: null, p_category: null, p_urgent_only: false, p_sort: "newest", p_limit: Math.min(80, Math.max(limit * 5, 30)) });
  if (error) return { success: false, code: "RECOMMENDATIONS_FAILED", message: "تعذر تحميل التوصيات الآن." };
  const preferences = { skills: Array.isArray(preferenceRow.skills) ? preferenceRow.skills.map(String) : [], availability: String(preferenceRow.availability ?? "flexible"), city: preferenceRow.city ? String(preferenceRow.city) : null };
  const rows = (data ?? []) as Record<string, unknown>[];
  const recommendations: RecommendedGig[] = rows.map(row => scoreGigMatch(mapJobSeekerGig(row), preferences));
  return { success: true, data: recommendations.sort((a, b) => b.score - a.score).slice(0, limit) };
}
