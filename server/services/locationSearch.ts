import type { ApiResult } from "@shared/brikouli.types";
import { makeRequest } from "../_core/map";
import { locationSearchSchema } from "../schemas/domain";

export type LocationSuggestion = { label: string; latitude: number; longitude: number };
type GoogleGeocodeResponse = { status: string; results?: Array<{ formatted_address: string; geometry: { location: { lat: number; lng: number } } }> };

export async function searchMoroccanLocations(input: unknown): Promise<ApiResult<LocationSuggestion[]>> {
  const parsed = locationSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, code: "LOCATION_SEARCH_INVALID", message: parsed.error.issues[0]?.message ?? "اكتب اسم مدينة أو حي للبحث." };
  try {
    const response = await makeRequest<GoogleGeocodeResponse>("/maps/api/geocode/json", { address: `${parsed.data.query}, Morocco`, region: "MA", language: "ar" });
    if (response.status !== "OK") return { success: true, data: [] };
    return { success: true, data: (response.results ?? []).slice(0, 5).map(result => ({ label: result.formatted_address, latitude: result.geometry.location.lat, longitude: result.geometry.location.lng })) };
  } catch {
    return { success: false, code: "LOCATION_SEARCH_FAILED", message: "تعذر البحث عن الموقع حالياً." };
  }
}
