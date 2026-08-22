import { describe, expect, it } from "vitest";
import { expandArabicSearch } from "./services/smartSearch";
import { scoreGigMatch } from "./lib/ai/matching";
import { analyzeGigSafety } from "./lib/ai/moderation";
import { groupNotifications } from "../client/src/pages/Notifications";

describe("Phase 10 production foundations", () => {
  it("normalizes and expands Arabic delivery search intent", () => {
    const terms = expandArabicSearch("توصيل في مراكش");
    expect(terms).toContain("توصيل في مراكش");
    expect(terms).toContain("دليفري");
  });

  it("scores a skills and city match deterministically", () => {
    const recommendation = scoreGigMatch({ id: "gig-1", employerId: "employer-1", title: "مطلوب توصيل طلبات", description: "فرصة توصيل داخل المدينة", category: "توصيل", city: "مراكش", neighborhood: null, latitude: null, longitude: null, payment: 80, paymentType: "fixed", duration: "4 ساعات", urgent: false, status: "active", createdAt: new Date().toISOString(), employerName: "متجر" }, { skills: ["توصيل"], city: "مراكش", availability: "flexible" });
    expect(recommendation.score).toBeGreaterThan(50);
    expect(recommendation.matchFactors).toContain("skills");
    expect(recommendation.matchFactors).toContain("location");
  });

  it("keeps deterministic harmful-work signals above optional AI", async () => {
    const result = await analyzeGigSafety({ title: "صيانة أسلاك مكشوفة", description: "عمل كهرباء جهد عال", category: "أخرى" });
    expect(result.riskLevel).toBe("blocked");
    expect(result.source).toBe("deterministic");
  });

  it("groups durable notifications into today and earlier", () => {
    const now = new Date("2026-08-22T12:00:00.000Z");
    const groups = groupNotifications([{ id: "today", userId: "u", type: "new_message", title: "رسالة", message: "نص", href: null, metadata: {}, read: false, readAt: null, createdAt: "2026-08-22T08:00:00.000Z" }, { id: "old", userId: "u", type: "rating_received", title: "تقييم", message: "نص", href: null, metadata: {}, read: true, readAt: "2026-08-21T08:00:00.000Z", createdAt: "2026-08-21T08:00:00.000Z" }], now);
    expect(groups.today).toHaveLength(1);
    expect(groups.earlier).toHaveLength(1);
  });
});
