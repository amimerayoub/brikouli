import { describe, expect, it } from "vitest";
import { categories, jobById, phase3Jobs } from "./phase3-data";
describe("Phase 3 interface fixtures", () => { it("provides a stable job detail fallback and quick categories", () => { expect(phase3Jobs.length).toBeGreaterThanOrEqual(3); expect(jobById("shelves").title).toBe("تنظيم رفوف متجر"); expect(jobById("missing").id).toBe(phase3Jobs[0]?.id); expect(categories).toContain("مطاعم"); }); });
