-- Phase 6 RLS hardening: employer-only business fields and explicit lifecycle ownership policies.

revoke update (business_name, business_category, business_description) on public.profiles from authenticated;

create or replace function public.update_employer_business_profile(
  p_full_name text,
  p_phone text,
  p_city text,
  p_neighborhood text,
  p_avatar_url text,
  p_business_name text,
  p_business_category text,
  p_business_description text
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare updated_profile public.profiles%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'employer'::public.user_role
  ) then
    raise exception using errcode = '42501', message = 'EMPLOYER_ROLE_REQUIRED';
  end if;

  update public.profiles
  set full_name = p_full_name,
      phone = p_phone,
      city = p_city,
      neighborhood = p_neighborhood,
      avatar_url = p_avatar_url,
      business_name = p_business_name,
      business_category = p_business_category,
      business_description = p_business_description
  where id = (select auth.uid())
  returning * into updated_profile;

  return updated_profile;
end;
$$;

drop policy if exists "gigs_delete_drafts_by_owner" on public.gigs;
create policy "gigs_delete_draft_or_cancelled_by_owner" on public.gigs
for delete to authenticated
using ((employer_id = (select auth.uid()) and status in ('draft'::public.gig_status, 'cancelled'::public.gig_status)) or public.is_admin());

drop policy if exists "applications_update_by_employer_or_admin" on public.applications;
create policy "applications_review_by_gig_owner_or_admin" on public.applications
for update to authenticated
using (public.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())))
with check (public.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())));

grant execute on function public.update_employer_business_profile(text, text, text, text, text, text, text, text) to authenticated;
