import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OPENFREEMAP_STYLE_URL } from "../client/src/lib/map/config";
import { markerClassName, markerSymbol } from "../client/src/components/maps/GigMarker";
import { defaultMapMode } from "../client/src/lib/map/mode";

describe("Phase 5 key-free map stack", () => {
  it("uses the OpenFreeMap Liberty style and preserves Brikouli marker semantics", () => {
    expect(OPENFREEMAP_STYLE_URL).toBe("https://tiles.openfreemap.org/styles/liberty");
    expect(markerSymbol("متاجر")).toBe("م");
    expect(markerClassName(true)).toContain("map-gig-marker-urgent");
  });

  it("contains no active Google map imports in the migrated map source", () => {
    const mapView = readFileSync(new URL("../client/src/components/maps/MapView.tsx", import.meta.url), "utf8");
    const searchService = readFileSync(new URL("./services/locationSearch.ts", import.meta.url), "utf8");
    expect(mapView).not.toMatch(/google\.maps|Google Maps|managedMap/i);
    expect(searchService).not.toMatch(/makeRequest|maps\/api\/geocode|GoogleGeocode/i);
  });

  it("connects marker selection to the existing mobile Bottom Sheet and responsive modes", () => {
    const discovery = readFileSync(new URL("../client/src/components/maps/MapDiscovery.tsx", import.meta.url), "utf8");
    expect(discovery).toContain("onSelect={gig => setSelectedGigId(gig.id)}");
    expect(discovery).toContain("BottomSheet open={Boolean(selectedGig)}");
    expect(defaultMapMode(390)).toBe("map");
    expect(defaultMapMode(1280)).toBe("split");
  });

  it("submits location search deliberately and includes every filter in the nearby-gig query", () => {
    const discovery = readFileSync(new URL("../client/src/components/maps/MapDiscovery.tsx", import.meta.url), "utf8");
    expect(discovery).toContain("searchLocations.mutate({ query: search })");
    expect(discovery).toContain("radiusKm, sort, category, urgentOnly, limit: 50");
    expect(discovery).toContain("onClick={() => setRadiusKm(radius)}");
    expect(discovery).toContain("onClick={() => setCategory(item)}");
    expect(discovery).toContain('onClick={() => setSort("newest")}');
    expect(discovery).toContain("onClick={() => setUrgentOnly(value => !value)}");
    expect(discovery).toContain("setRadiusKm(5);");
  });
});
