-- Brikouli Phase 2: Supabase Auth profile extension, marketplace data, RLS, and Storage.
-- This migration is safe to apply once to a new Supabase project; run through Supabase migration tooling.

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('job_seeker', 'employer', 'admin');
create type public.gig_status as enum ('draft', 'active', 'assigned', 'completed', 'cancelled');
create type public.application_status as enum ('pending', 'accepted', 'rejected');
create type public.payment_type as enum ('fixed', 'hourly');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text unique check (phone is null or char_length(phone) between 7 and 32),
  role public.user_role not null default 'job_seeker',
  city text check (city is null or char_length(city) <= 120),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 120),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  completed_jobs integer not null default 0 check (completed_jobs >= 0),
  accepted_terms boolean not null default false,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint accepted_terms_timestamp check ((accepted_terms and accepted_terms_at is not null) or not accepted_terms)
);

create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 4 and 140),
  description text not null check (char_length(description) between 12 and 4000),
  category text not null check (char_length(category) between 2 and 80),
  city text not null check (char_length(city) <= 120),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 120),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  payment numeric(10,2) not null check (payment > 0),
  payment_type public.payment_type not null default 'fixed',
  duration text not null check (char_length(duration) between 1 and 80),
  status public.gig_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  unique (gig_id, applicant_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default timezone('utc', now()),
  constraint rating_distinct_users check (from_user <> to_user),
  unique (gig_id, from_user, to_user)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'gig', 'application', 'rating')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 4 and 1500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now())
);

create index gigs_active_location_idx on public.gigs (city, neighborhood, created_at desc) where status = 'active';
create index gigs_employer_idx on public.gigs (employer_id, created_at desc);
create index applications_gig_idx on public.applications (gig_id, status);
create index applications_applicant_idx on public.applications (applicant_id, created_at desc);
create index ratings_target_idx on public.ratings (to_user, created_at desc);
create index reports_status_idx on public.reports (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role, accepted_terms, accepted_terms_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'role' = 'employer' then 'employer'::public.user_role else 'job_seeker'::public.user_role end,
    case when new.raw_user_meta_data ->> 'accepted_terms' = 'true' then true else false end,
    case when new.raw_user_meta_data ->> 'accepted_terms' = 'true' then timezone('utc', now()) else null end
  );
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'::public.user_role
  );
$$;

create or replace function public.is_employer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'employer'::public.user_role
  );
$$;

create or replace view public.public_profiles
with (security_invoker = true)
as select id, full_name, role, city, neighborhood, avatar_url, rating, completed_jobs, created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.gigs, public.applications, public.ratings, public.reports to authenticated;
revoke update (role, rating, completed_jobs, accepted_terms, accepted_terms_at, created_at, updated_at) on public.profiles from authenticated;
grant update (full_name, phone, city, neighborhood, avatar_url) on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.applications enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select using ((select auth.uid()) = id or public.is_admin());
create policy "profiles_insert_self" on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles_update_self_or_admin" on public.profiles for update using ((select auth.uid()) = id or public.is_admin()) with check ((select auth.uid()) = id or public.is_admin());

create policy "gigs_read_active_or_owner" on public.gigs for select using (status = 'active' or employer_id = (select auth.uid()) or public.is_admin());
create policy "gigs_create_by_employer" on public.gigs for insert with check (employer_id = (select auth.uid()) and public.is_employer());
create policy "gigs_update_by_owner" on public.gigs for update using (employer_id = (select auth.uid()) or public.is_admin()) with check (employer_id = (select auth.uid()) or public.is_admin());
create policy "gigs_delete_drafts_by_owner" on public.gigs for delete using ((employer_id = (select auth.uid()) and status = 'draft') or public.is_admin());

create policy "applications_read_participants" on public.applications for select using (applicant_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())));
create policy "applications_create_by_applicant" on public.applications for insert with check (applicant_id = (select auth.uid()) and status = 'pending' and exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.status = 'active' and gigs.employer_id <> (select auth.uid())));
create policy "applications_update_by_employer_or_admin" on public.applications for update using (public.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid()))) with check (public.is_admin() or exists (select 1 from public.gigs where gigs.id = applications.gig_id and gigs.employer_id = (select auth.uid())));

create policy "ratings_read_public" on public.ratings for select using (true);
create policy "ratings_create_after_completed_gig" on public.ratings for insert with check (
  from_user = (select auth.uid()) and exists (
    select 1 from public.gigs g join public.applications a on a.gig_id = g.id
    where g.id = ratings.gig_id and g.status = 'completed' and a.status = 'accepted'
      and ((g.employer_id = (select auth.uid()) and a.applicant_id = ratings.to_user) or (a.applicant_id = (select auth.uid()) and g.employer_id = ratings.to_user))
  )
);

create policy "reports_read_self_or_admin" on public.reports for select using (reporter_id = (select auth.uid()) or public.is_admin());
create policy "reports_create_self" on public.reports for insert with check (reporter_id = (select auth.uid()));
create policy "reports_manage_admin" on public.reports for update using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('voice-notes', 'voice-notes', false, 10485760, array['audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/wav']),
  ('gig-images', 'gig-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars_read_authenticated" on storage.objects for select to authenticated using (bucket_id = 'avatars');
create policy "avatars_insert_own_folder" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "avatars_update_own_folder" on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'avatars' and owner_id = (select auth.uid()::text));
create policy "avatars_delete_own_folder" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and owner_id = (select auth.uid()::text));

create policy "voice_notes_read_own" on storage.objects for select to authenticated using (bucket_id = 'voice-notes' and owner_id = (select auth.uid()::text));
create policy "voice_notes_insert_own_folder" on storage.objects for insert to authenticated with check (bucket_id = 'voice-notes' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "voice_notes_update_own" on storage.objects for update to authenticated using (bucket_id = 'voice-notes' and owner_id = (select auth.uid()::text)) with check (bucket_id = 'voice-notes' and owner_id = (select auth.uid()::text));
create policy "voice_notes_delete_own" on storage.objects for delete to authenticated using (bucket_id = 'voice-notes' and owner_id = (select auth.uid()::text));

create policy "gig_images_read_active_or_owner" on storage.objects for select to authenticated using (bucket_id = 'gig-images' and (exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and (gigs.status = 'active' or gigs.employer_id = (select auth.uid()))) or public.is_admin()));
create policy "gig_images_insert_owner" on storage.objects for insert to authenticated with check (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));
create policy "gig_images_update_owner" on storage.objects for update to authenticated using (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid()))) with check (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));
create policy "gig_images_delete_owner" on storage.objects for delete to authenticated using (bucket_id = 'gig-images' and exists (select 1 from public.gigs where gigs.id::text = (storage.foldername(name))[1] and gigs.employer_id = (select auth.uid())));
