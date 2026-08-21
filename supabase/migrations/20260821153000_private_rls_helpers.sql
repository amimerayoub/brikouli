-- Keep RLS helpers out of the PostgREST-exposed public schema while allowing policies to evaluate them.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'::public.user_role);
$$;
create or replace function private.is_employer()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'employer'::public.user_role);
$$;
create or replace function private.is_job_seeker()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'job_seeker'::public.user_role);
$$;
grant execute on function private.is_admin(), private.is_employer(), private.is_job_seeker() to anon, authenticated;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select using ((select auth.uid()) = id or private.is_admin());
create policy "profiles_update_self_or_admin" on public.profiles for update using ((select auth.uid()) = id or private.is_admin()) with check ((select auth.uid()) = id or private.is_admin());

drop policy if exists "gigs_read_active_or_owner" on public.gigs;
drop policy if exists "gigs_create_by_employer" on public.gigs;
drop policy if exists "gigs_update_by_owner" on public.gigs;
drop policy if exists "gigs_delete_drafts_by_owner" on public.gigs;
create policy "gigs_read_active_or_owner" on public.gigs for select using (status = 'active' or employer_id = (select auth.uid()) or private.is_admin());
create policy "gigs_create_by_employer" on public.gigs for insert with check (employer_id = (select auth.uid()) and private.is_employer());
create policy "gigs_update_by_owner" on public.gigs for update using (employer_id = (select auth.uid()) or private.is_admin()) with check (employer_id = (select auth.uid()) or private.is_admin());
create policy "gigs_delete_drafts_by_owner" on public.gigs for delete using ((employer_id = (select auth.uid()) and status = 'draft') or private.is_admin());

drop policy if exists "applications_read_participants" on public.applications;
drop policy if exists "applications_create_by_applicant" on public.applications;
drop policy if exists "applications_update_by_employer_or_admin" on public.applications;
create policy "applications_read_participants" on public.applications for select using (applicant_id = (select auth.uid()) or private.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())));
create policy "applications_create_by_applicant" on public.applications for insert with check (applicant_id = (select auth.uid()) and status = 'pending' and private.is_job_seeker() and exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.status = 'active' and gigs.employer_id <> (select auth.uid())));
create policy "applications_update_by_employer_or_admin" on public.applications for update using (private.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid()))) with check (private.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())));

drop policy if exists "reports_read_self_or_admin" on public.reports;
drop policy if exists "reports_manage_admin" on public.reports;
create policy "reports_read_self_or_admin" on public.reports for select using (reporter_id = (select auth.uid()) or private.is_admin());
create policy "reports_manage_admin" on public.reports for update using (private.is_admin()) with check (private.is_admin());

drop policy if exists "gig_images_read_active_or_owner" on storage.objects;
drop policy if exists "gig_images_insert_owner" on storage.objects;
drop policy if exists "gig_images_update_owner" on storage.objects;
drop policy if exists "gig_images_delete_owner" on storage.objects;
create policy "gig_images_read_active_or_owner" on storage.objects for select to authenticated using (bucket_id = 'gig-images' and (exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and (gigs.status = 'active' or gigs.employer_id = (select auth.uid()))) or private.is_admin()));
create policy "gig_images_insert_owner" on storage.objects for insert to authenticated with check (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));
create policy "gig_images_update_owner" on storage.objects for update to authenticated using (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid()))) with check (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));
create policy "gig_images_delete_owner" on storage.objects for delete to authenticated using (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));

revoke execute on function public.handle_new_user(), public.is_admin(), public.is_employer(), public.is_job_seeker() from public, anon, authenticated;
