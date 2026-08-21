import type { ApiResult } from "@shared/brikouli.types";
import { createSupabaseForAccessToken } from "../services/supabase";

export async function logoutAction(accessToken: string): Promise<ApiResult<null>> { const client = createSupabaseForAccessToken(accessToken); if ("success" in client) return client; const { error } = await client.auth.signOut(); return error ? { success: false, code: "LOGOUT_FAILED", message: "تعذر إنهاء الجلسة." } : { success: true, data: null }; }
