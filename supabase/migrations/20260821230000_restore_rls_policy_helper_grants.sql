-- RLS policy helpers must be executable by the authenticated role when used
-- from public-table policies. Keep implementation/audit helpers private.
grant execute on function public.is_admin(), public.is_job_seeker(), public.is_active_account() to authenticated;
revoke execute on function public.is_admin(), public.is_job_seeker(), public.is_active_account() from anon;
