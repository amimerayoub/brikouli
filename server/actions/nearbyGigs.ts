import type { ApiResult, NearbyGig } from "@shared/brikouli.types";
import { getNearbyGigs } from "../services/gigs";

/** Server action adapter for location-based discovery; browser code never performs SQL. */
export async function getNearbyGigsAction(input: unknown): Promise<ApiResult<NearbyGig[]>> {
  return getNearbyGigs(input);
}
