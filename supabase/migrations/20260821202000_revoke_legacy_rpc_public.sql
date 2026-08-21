-- Security hardening for previously introduced employer RPCs. Their internal
-- ownership checks remain authoritative, but anonymous callers must not reach them.

revoke execute on function public.delete_employer_gig(uuid) from public, anon;
revoke execute on function public.review_employer_application(uuid, public.application_status) from public, anon;
revoke execute on function public.update_employer_business_profile(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.delete_employer_gig(uuid) to authenticated;
grant execute on function public.review_employer_application(uuid, public.application_status) to authenticated;
grant execute on function public.update_employer_business_profile(text, text, text, text, text, text, text, text) to authenticated;
