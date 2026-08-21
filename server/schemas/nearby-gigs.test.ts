import { describe, expect, it } from "vitest";
import { nearbyGigQuerySchema } from "./domain";
describe("Phase 4 nearby-gig validation", () => {
  const base = { latitude: 33.5731, longitude: -7.5898 };
  it("accepts supported radius and sort filters", () => { expect(nearbyGigQuerySchema.safeParse({ ...base, radiusKm: 3, sort: "highest_pay", urgentOnly: true }).success).toBe(true); });
  it("rejects unsupported radii and inverted payment ranges", () => { expect(nearbyGigQuerySchema.safeParse({ ...base, radiusKm: 2 }).success).toBe(false); expect(nearbyGigQuerySchema.safeParse({ ...base, minPayment: 120, maxPayment: 90 }).success).toBe(false); });
});
