import type { ApiResult } from "@shared/brikouli.types";
import { locationSearchSchema } from "../schemas/domain";

export type LocationSuggestion = { label: string; latitude: number; longitude: number };
type NominatimResponse = Array<{ display_name: string; lat: string; lon: string }>;
const cache = new Map<string, LocationSuggestion[]>();
let nextRequestAt = 0;

export async function searchMoroccanLocations(input: unknown): Promise<ApiResult<LocationSuggestion[]>> {
  const parsed = locationSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "LOCATION_SEARCH_INVALID", message: parsed.error.issues[0]?.message ?? "اكتب اسم مدينة أو حي للبحث." };
  const query = parsed.data.query.toLocaleLowerCase();
  const cached = cache.get(query);
  if (cached) return { success: true, data: cached };
  try {
    const wait = Math.max(0, nextRequestAt - Date.now());
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    nextRequestAt = Date.now() + 1_000;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${parsed.data.query}, Morocco`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "ma");
    url.searchParams.set("accept-language", "ar");
    const response = await fetch(url, { headers: { "User-Agent": "Brikouli/1.0 (location search)", Accept: "application/json" } });
    if (!response.ok) return { success: false, code: "LOCATION_SEARCH_FAILED", message: "تعذر البحث عن الموقع حالياً." };
    const data = await response.json() as NominatimResponse;
    const suggestions = data.map(item => ({ label: item.display_name, latitude: Number(item.lat), longitude: Number(item.lon) })).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    cache.set(query, suggestions);
    return { success: true, data: suggestions };
  } catch {
    return { success: false, code: "LOCATION_SEARCH_FAILED", message: "تعذر البحث عن الموقع حالياً." };
  }
}
