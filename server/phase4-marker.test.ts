import { describe, expect, it } from "vitest";
import { markerClassName, markerSymbol } from "../client/src/components/maps/GigMarker";
describe("Phase 4 map-marker semantics", () => {
  it("assigns the Brikouli category glyph and urgent marker treatment", () => {
    expect(markerSymbol("مطاعم")).toBe("ط");
    expect(markerSymbol("غير مصنف")).toBe("◔");
    expect(markerClassName(true)).toContain("map-gig-marker-urgent");
    expect(markerClassName(false)).not.toContain("map-gig-marker-urgent");
  });
});
