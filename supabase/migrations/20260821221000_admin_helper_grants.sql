-- Phase 9 follow-up: internal helpers are never callable from authenticated REST clients.
revoke execute on function public.is_active_account() from authenticated;
revoke execute on function public.enforce_active_account_write() from authenticated;
revoke execute on function public.write_admin_audit(text, text, uuid, jsonb) from authenticated;
