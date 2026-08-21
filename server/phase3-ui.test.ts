import { describe, expect, it } from "vitest";
import { categories, jobById, phase3Jobs } from "../client/src/lib/phase3-data";

describe("Phase 3 marketplace interface fixtures", () => {
  it("provides stable local jobs, requested categories, and a safe detail fallback", () => {
    expect(phase3Jobs.length).toBeGreaterThanOrEqual(3);
    expect(categories).toEqual(expect.arrayContaining(["متاجر", "مطاعم", "تنظيم", "استقبال", "تنظيف", "أخرى"]));
    expect(jobById("shelves").title).toBe("تنظيم رفوف متجر");
    expect(jobById("unknown").id).toBe(phase3Jobs[0]?.id);
  });
});
