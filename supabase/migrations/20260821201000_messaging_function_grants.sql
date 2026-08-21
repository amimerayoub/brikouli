-- Phase 7 security hardening: SECURITY DEFINER helpers must never inherit the
-- default PUBLIC execute privilege. Only the two participant-facing RPCs are
-- callable by signed-in users; trigger helpers remain non-callable.

revoke execute on function public.create_accepted_application_conversation() from public, anon, authenticated;
revoke execute on function public.touch_conversation_after_message() from public, anon, authenticated;
revoke execute on function public.close_owned_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.close_owned_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
