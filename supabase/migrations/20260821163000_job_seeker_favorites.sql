-- Phase 5 Job Seeker: private saved-gig persistence.
-- Each authenticated Job Seeker owns and may manage only their own saved rows.

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, gig_id)
);

create index favorites_user_created_idx
on public.favorites (user_id, created_at desc);

grant select, insert, delete on public.favorites to authenticated;

alter table public.favorites enable row level security;

create policy "favorites_select_own_or_admin" on public.favorites
for select using (user_id = (select auth.uid()) or public.is_admin());

create policy "favorites_insert_own" on public.favorites
for insert with check (user_id = (select auth.uid()));

create policy "favorites_delete_own_or_admin" on public.favorites
for delete using (user_id = (select auth.uid()) or public.is_admin());
