import type { JobSeekerGig, RecommendedGig } from "@shared/brikouli.types";
import { normalizeArabicText, semanticSearchPreparation } from "./embeddings";

export function scoreGigMatch(gig: JobSeekerGig, preferences: { skills: string[]; city: string | null; availability: string }) : RecommendedGig {
  const factors: RecommendedGig["matchFactors"] = [];
  let score = 18;
  const content = normalizeArabicText(`${gig.title} ${gig.description} ${gig.category}`);
  const skills = preferences.skills.map(normalizeArabicText).filter(Boolean);
  if (skills.some(skill => content.includes(skill))) { score += 34; factors.push("skills"); }
  if (preferences.city && normalizeArabicText(gig.city) === normalizeArabicText(preferences.city)) { score += 22; factors.push("location"); }
  if (semanticSearchPreparation(gig.category).some(term => skills.includes(term))) { score += 12; if (!factors.includes("category")) factors.push("category"); }
  if (preferences.availability !== "unavailable") { score += 8; factors.push("availability"); }
  const ageDays = Math.max(0, (Date.now() - new Date(gig.createdAt).getTime()) / 86_400_000);
  if (ageDays <= 7) { score += 6; factors.push("freshness"); }
  const reason = factors.length ? `تطابق بناءً على ${factors.map(value => ({ skills: "مهاراتك", location: "مدينتك", category: "الفئة", availability: "توفرّك", trust: "الموثوقية", freshness: "حداثة النشر" })[value]).join(" و")}.` : "فرصة محلية نشطة قد تناسب بحثك.";
  return { ...gig, score: Math.min(100, score), reason, distanceMeters: null, matchFactors: factors };
}
