-- Phase 6: hard deletion is limited to safe employer-owned records with no applicant history.

revoke delete on public.gigs from authenticated;

create or replace function public.delete_employer_gig(p_gig_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_gig public.gigs%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'employer'::public.user_role
  ) then
    raise exception using errcode = '42501', message = 'EMPLOYER_ROLE_REQUIRED';
  end if;

  select * into target_gig from public.gigs where id = p_gig_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'GIG_NOT_FOUND';
  end if;
  if target_gig.employer_id <> (select auth.uid()) then
    raise exception using errcode = '42501', message = 'GIG_OWNERSHIP_REQUIRED';
  end if;
  if target_gig.status not in ('draft'::public.gig_status, 'cancelled'::public.gig_status) then
    raise exception using errcode = 'P0001', message = 'GIG_MUST_BE_CANCELLED_FIRST';
  end if;
  if target_gig.status = 'cancelled'::public.gig_status and exists (select 1 from public.applications where gig_id = target_gig.id) then
    raise exception using errcode = 'P0001', message = 'GIG_HAS_APPLICANT_HISTORY';
  end if;

  delete from public.gigs where id = target_gig.id;
  return target_gig.id;
end;
$$;

grant execute on function public.delete_employer_gig(uuid) to authenticated;
