import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSupabaseSession() {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let mounted = true; try { const client = getSupabaseBrowserClient(); client.auth.getUser().then(({ data }) => { if (mounted) { setUser(data.user); setLoading(false); } }); const { data: listener } = client.auth.onAuthStateChange((_event, session) => { if (mounted) setUser(session?.user ?? null); }); return () => { mounted = false; listener.subscription.unsubscribe(); }; } catch { setLoading(false); return () => { mounted = false; }; } }, []);
  return { user, loading, isAuthenticated: Boolean(user) };
}
