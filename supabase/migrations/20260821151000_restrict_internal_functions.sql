-- Supabase security-advisor remediation: internal trigger and RLS helper functions
-- must not be callable through the public RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.is_employer() from public, anon, authenticated;
