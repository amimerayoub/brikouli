-- Expose only explicit safe profile fields without relying on a SECURITY DEFINER view.
drop view if exists public.public_profiles;

create table public.public_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  city text,
  neighborhood text,
  avatar_url text,
  rating numeric(2,1) not null default 0,
  completed_jobs integer not null default 0,
  created_at timestamptz not null
);
alter table public.public_profiles enable row level security;
grant select on public.public_profiles to anon, authenticated;
create policy "public_profile_projection_read" on public.public_profiles for select using (true);

create or replace function private.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.public_profiles (id, full_name, role, city, neighborhood, avatar_url, rating, completed_jobs, created_at)
  values (new.id, new.full_name, new.role, new.city, new.neighborhood, new.avatar_url, new.rating, new.completed_jobs, new.created_at)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    city = excluded.city,
    neighborhood = excluded.neighborhood,
    avatar_url = excluded.avatar_url,
    rating = excluded.rating,
    completed_jobs = excluded.completed_jobs;
  return new;
end;
$$;
revoke execute on function private.sync_public_profile() from public, anon, authenticated;

create trigger profiles_sync_public_projection
after insert or update of full_name, role, city, neighborhood, avatar_url, rating, completed_jobs on public.profiles
for each row execute procedure private.sync_public_profile();

insert into public.public_profiles (id, full_name, role, city, neighborhood, avatar_url, rating, completed_jobs, created_at)
select id, full_name, role, city, neighborhood, avatar_url, rating, completed_jobs, created_at from public.profiles
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  city = excluded.city,
  neighborhood = excluded.neighborhood,
  avatar_url = excluded.avatar_url,
  rating = excluded.rating,
  completed_jobs = excluded.completed_jobs;
