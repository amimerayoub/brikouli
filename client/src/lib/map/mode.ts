export type MapMode = "map" | "list" | "split";
export function defaultMapMode(viewportWidth: number): MapMode { return viewportWidth >= 760 ? "split" : "map"; }
