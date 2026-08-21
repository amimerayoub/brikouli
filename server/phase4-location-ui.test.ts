import { describe, expect, it } from "vitest";
import { locationStateFromError } from "../client/src/lib/map/geolocation";
import { defaultMapMode } from "../client/src/lib/map/mode";

describe("Phase 4 location and responsive map behavior", () => {
  it("keeps discovery available for denied and unavailable location states", () => {
    expect(locationStateFromError(1)).toMatchObject({ status: "denied", coordinates: null });
    expect(locationStateFromError(2)).toMatchObject({ status: "unavailable", coordinates: null });
  });
  it("defaults to map-first mobile and split desktop discovery", () => {
    expect(defaultMapMode(390)).toBe("map");
    expect(defaultMapMode(1280)).toBe("split");
  });
});
