import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { ApiFailure, ApiResult, BrikouliProfile, UserRole } from "@shared/brikouli.types";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function configError(): ApiFailure {
  return { success: false, code: "SUPABASE_NOT_CONFIGURED", message: "تعذر إعداد خدمة الحسابات حالياً." };
}

export function createSupabaseForAccessToken(accessToken: string): SupabaseClient | ApiFailure {
  if (!supabaseUrl || !publishableKey) return configError();
  return createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export function createPublicSupabase(): SupabaseClient | ApiFailure {
  if (!supabaseUrl || !publishableKey) return configError();
  return createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export type VerifiedActor = { authUser: User; profile: BrikouliProfile };

function mapProfile(row: Record<string, unknown>): BrikouliProfile {
  return {
    id: String(row.id), fullName: String(row.full_name ?? ""), phone: row.phone ? String(row.phone) : null,
    role: String(row.role) as UserRole, city: row.city ? String(row.city) : null,
    neighborhood: row.neighborhood ? String(row.neighborhood) : null, avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    rating: Number(row.rating ?? 0), completedJobs: Number(row.completed_jobs ?? 0), acceptedTerms: Boolean(row.accepted_terms),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export async function verifyActor(accessToken: string): Promise<ApiResult<VerifiedActor>> {
  const client = createSupabaseForAccessToken(accessToken);
  if ("success" in client) return client;
  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) return { success: false, code: "UNAUTHORIZED", message: "انتهت جلستك. سجّل الدخول من جديد." };
  const { data: profile, error: profileError } = await client.from("profiles").select("*").eq("id", userData.user.id).single();
  if (profileError || !profile) return { success: false, code: "PROFILE_NOT_FOUND", message: "تعذر تحميل ملف الحساب." };
  return { success: true, data: { authUser: userData.user, profile: mapProfile(profile) } };
}

export function requireRole(actor: VerifiedActor, acceptedRoles: readonly UserRole[]): ApiFailure | null {
  if (!acceptedRoles.includes(actor.profile.role)) return { success: false, code: "FORBIDDEN", message: "لا تملك الصلاحية اللازمة لهذا الإجراء." };
  return null;
}
