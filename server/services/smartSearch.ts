import type { ApiResult, JobSeekerGig } from "@shared/brikouli.types";
import { smartSearchSchema } from "../schemas/domain";
import { createSupabaseForAccessToken, verifyActor } from "./supabase";
import { mapJobSeekerGig } from "./gigs";
import { normalizeArabicText } from "../lib/ai/embeddings";

const synonymMap: Record<string, string[]> = { "توصيل": ["توصيل", "دليفري", "delivery"], "مطعم": ["مطعم", "كافيه", "مقهى"], "متجر": ["متجر", "محل", "بيع"], "تنظيف": ["تنظيف", "نظافة"], "استقبال": ["استقبال", "خدمة زبناء"] };

export function expandArabicSearch(query: string) {
  const normalized = normalizeArabicText(query);
  const terms = new Set<string>([normalized]);
  Object.entries(synonymMap).forEach(([key, values]) => { if (normalized.includes(normalizeArabicText(key))) values.forEach(value => terms.add(value)); });
  return Array.from(terms).filter(Boolean).slice(0, 5);
}

export async function smartSearchGigs(accessToken: string, input: unknown): Promise<ApiResult<{ gigs: JobSeekerGig[]; normalizedQuery: string; expandedTerms: string[] }>> {
  const parsed = smartSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "SMART_SEARCH_INVALID", message: parsed.error.issues[0]?.message ?? "عبارة البحث غير صالحة." };
  const actor = await verifyActor(accessToken);
  if (!actor.success) return actor;
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const normalizedQuery = normalizeArabicText(parsed.data.query);
  const expandedTerms = expandArabicSearch(parsed.data.query);
  const batches = await Promise.all(expandedTerms.map(term => client.rpc("list_job_seeker_gigs", { p_query: term, p_category: parsed.data.category ?? null, p_urgent_only: parsed.data.urgentOnly, p_sort: parsed.data.sort, p_limit: parsed.data.limit })));
  const failed = batches.find(batch => batch.error);
  if (failed?.error) return { success: false, code: "SMART_SEARCH_FAILED", message: "تعذر تنفيذ البحث الذكي." };
  const seen = new Set<string>();
  const gigs = batches.flatMap(batch => batch.data ?? []).map((row: Record<string, unknown>) => mapJobSeekerGig(row)).filter(gig => !seen.has(gig.id) && Boolean(seen.add(gig.id))).slice(0, parsed.data.limit);
  await client.from("search_events").insert({ user_id: actor.data.profile.id, query: parsed.data.query, normalized_query: normalizedQuery, category: parsed.data.category ?? null, city: actor.data.profile.city ?? null });
  return { success: true, data: { gigs, normalizedQuery, expandedTerms } };
}
