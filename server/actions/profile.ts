import type { ApiResult, BrikouliProfile } from "@shared/brikouli.types";
import { updateCurrentProfile } from "../services/profiles";

export async function updateProfileAction(accessToken: string, input: unknown): Promise<ApiResult<BrikouliProfile>> { return updateCurrentProfile(accessToken, input); }
