import { describe, expect, it } from "vitest";
import { locationSearchSchema } from "./domain";
describe("Phase 4 location-search validation", () => {
  it("accepts Arabic city and neighbourhood searches and rejects empty input", () => {
    expect(locationSearchSchema.safeParse({ query: "مراكش" }).success).toBe(true);
    expect(locationSearchSchema.safeParse({ query: "   " }).success).toBe(false);
  });
});
