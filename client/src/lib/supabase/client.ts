/** Supabase browser-client preparation only. Do not add direct database access to UI components. */
export const supabaseBrowserConfig = { urlEnvKey: "NEXT_PUBLIC_SUPABASE_URL", anonKeyEnvKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY", configured: false } as const;
