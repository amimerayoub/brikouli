export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
export const OPENSTREETMAP_FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    openstreetmap: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "openstreetmap", type: "raster" as const, source: "openstreetmap" }],
};
export const DEFAULT_MAP_CENTER = { latitude: 31.6295, longitude: -7.9811 };
export const DEFAULT_MAP_ZOOM = 13;
