import { describe, expect, it } from "vitest";
import { formatDistance, haversineMeters } from "./distance";
describe("Phase 4 distance helpers", () => {
  it("calculates and formats Haversine distances consistently", () => {
    expect(haversineMeters({ latitude: 33.5731, longitude: -7.5898 }, { latitude: 33.5731, longitude: -7.5898 })).toBe(0);
    expect(haversineMeters({ latitude: 33.5731, longitude: -7.5898 }, { latitude: 33.5776, longitude: -7.5898 })).toBeGreaterThan(400);
    expect(formatDistance(350)).toBe("350 م");
    expect(formatDistance(1_200)).toBe("1.2 كم");
  });
});
