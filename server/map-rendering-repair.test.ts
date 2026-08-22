import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = readFileSync(new URL("../client/src/lib/map/config.ts", import.meta.url), "utf8");
const view = readFileSync(new URL("../client/src/components/maps/MapView.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/styles/map-render-fix.css", import.meta.url), "utf8");
const phaseFiveStyles = readFileSync(new URL("../client/src/styles/phase5.css", import.meta.url), "utf8");

describe("Explore MapLibre rendering repair", () => {
  it("retains the public OpenFreeMap primary style while providing a resilient raster fallback and responsive viewport", () => {
    expect(config).toContain('OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"');
    expect(config).toContain("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(config).toContain("latitude: 31.6295");
    expect(config).toContain("longitude: -7.9811");
    expect(view).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
    expect(view).toContain("new ResizeObserver(resize)");
    expect(view).toContain('setStyleSource("openstreetmap")');
    expect(view).toContain("تحميل الخريطة...");
    expect(view).toContain("تعذر تحميل الخريطة");
    expect(styles).toContain("min-height:420px");
    expect(styles).toContain("min-height:600px");
    expect(styles).toContain("border-radius:24px");
    expect(phaseFiveStyles).not.toContain("خريطة الحي");
    expect(phaseFiveStyles).not.toContain(".map-paper-panel:before");
  });
});
