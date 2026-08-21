import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Supabase configuration is unavailable.");
  browserClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: "pkce" },
  });
  return browserClient;
}
