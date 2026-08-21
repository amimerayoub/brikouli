import type { ApiResult } from "@shared/brikouli.types";
import { searchMoroccanLocations, type LocationSuggestion } from "../services/locationSearch";
export async function searchLocationsAction(input: unknown): Promise<ApiResult<LocationSuggestion[]>> { return searchMoroccanLocations(input); }
