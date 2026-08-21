import { describe, expect, it } from "vitest";
import { employerBusinessProfileSchema, employerGigCreateSchema, hazardousGigWarning } from "./domain";

const safeGig = { title: "مساعد لترتيب متجر", description: "مساعدة في ترتيب الرفوف وتجهيز مساحة المتجر خلال فترة الظهيرة.", category: "متجر" as const, city: "الدار البيضاء", neighborhood: "المعاريف", latitude: 33.5731, longitude: -7.5898, payment: 120, paymentType: "fixed" as const, duration: "4 ساعات", acceptanceLimit: 1, publish: true };

describe("Employer Workspace validation", () => {
  it("accepts a safe, complete employer gig and business profile", () => {
    expect(employerGigCreateSchema.safeParse(safeGig).success).toBe(true);
    expect(employerBusinessProfileSchema.safeParse({ fullName: "أمين المرابط", phone: "+212600000000", city: "الدار البيضاء", businessName: "متجر الحي", businessCategory: "متجر", businessDescription: "متجر محلي" }).success).toBe(true);
  });

  it("blocks hazardous work descriptions before publish", () => {
    expect(hazardousGigWarning({ ...safeGig, description: "صيانة كهرباء جهد عالٍ وأسلاك مكشوفة" })).toContain("لا يمكن نشر");
    expect(employerGigCreateSchema.safeParse({ ...safeGig, description: "صيانة high-voltage electrical work" }).success).toBe(false);
  });

  it("rejects unknown categories and invalid acceptance limits", () => {
    expect(employerGigCreateSchema.safeParse({ ...safeGig, category: "مخاطر" }).success).toBe(false);
    expect(employerGigCreateSchema.safeParse({ ...safeGig, acceptanceLimit: 0 }).success).toBe(false);
  });
});
