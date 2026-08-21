-- Keep base-profile RLS private while explicitly exposing only safe profile fields through a definer view.
drop view if exists public.public_profiles;
create view public.public_profiles as
select id, full_name, role, city, neighborhood, avatar_url, rating, completed_jobs, created_at
from public.profiles;
grant select on public.public_profiles to anon, authenticated;

create or replace function public.is_job_seeker()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'job_seeker'::public.user_role
  );
$$;
revoke execute on function public.is_job_seeker() from public, anon, authenticated;
