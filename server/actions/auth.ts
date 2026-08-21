import { createClient } from "@supabase/supabase-js";
import type { ApiResult } from "@shared/brikouli.types";
import { loginSchema, phoneOtpSchema, registerSchema, verifyOtpSchema } from "../schemas/auth";

function authClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
function validationFailure(error: { issues: Array<{ message: string }> }): ApiResult<never> { return { success: false, code: "VALIDATION_ERROR", message: error.issues[0]?.message ?? "بيانات الدخول غير صالحة." }; }

/** Server action contract: validate before calling Supabase Auth. UI owns browser-session persistence. */
export async function loginAction(input: unknown): Promise<ApiResult<{ accessToken: string; refreshToken: string }>> { const parsed = loginSchema.safeParse(input); if (!parsed.success) return validationFailure(parsed.error); const { data, error } = await authClient().auth.signInWithPassword(parsed.data); return error || !data.session ? { success: false, code: "LOGIN_FAILED", message: "تعذر تسجيل الدخول. تحقق من بياناتك." } : { success: true, data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token } }; }
export async function registerAction(input: unknown): Promise<ApiResult<{ requiresEmailConfirmation: boolean; accessToken?: string; refreshToken?: string }>> { const parsed = registerSchema.safeParse(input); if (!parsed.success) return validationFailure(parsed.error); const { data, error } = await authClient().auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { full_name: parsed.data.fullName, role: parsed.data.role, accepted_terms: true } } }); return error ? { success: false, code: "REGISTER_FAILED", message: "تعذر إنشاء الحساب." } : { success: true, data: { requiresEmailConfirmation: !data.session, accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token } }; }
export async function requestPhoneOtpAction(input: unknown): Promise<ApiResult<null>> { const parsed = phoneOtpSchema.safeParse(input); if (!parsed.success) return validationFailure(parsed.error); const { error } = await authClient().auth.signInWithOtp({ phone: parsed.data.phone }); return error ? { success: false, code: "OTP_SEND_FAILED", message: "تعذر إرسال الرمز." } : { success: true, data: null }; }
export async function verifyPhoneOtpAction(input: unknown): Promise<ApiResult<{ accessToken: string; refreshToken: string }>> { const parsed = verifyOtpSchema.safeParse(input); if (!parsed.success) return validationFailure(parsed.error); const { data, error } = await authClient().auth.verifyOtp({ phone: parsed.data.phone, token: parsed.data.token, type: "sms" }); return error || !data.session ? { success: false, code: "OTP_VERIFY_FAILED", message: "الرمز غير صالح أو انتهت صلاحيته." } : { success: true, data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token } }; }
