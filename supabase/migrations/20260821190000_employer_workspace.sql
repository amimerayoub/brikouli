-- Brikouli Phase 6: employer business workspace, safe gig lifecycle, and secure applicant review.

alter table public.profiles
  add column if not exists business_name text check (business_name is null or char_length(business_name) between 2 and 140),
  add column if not exists business_category text check (business_category is null or char_length(business_category) between 2 and 80),
  add column if not exists business_description text check (business_description is null or char_length(business_description) <= 1600);

alter table public.gigs
  add column if not exists acceptance_limit integer not null default 1 check (acceptance_limit between 1 and 20),
  add column if not exists is_paused boolean not null default false,
  add column if not exists work_date date,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add constraint gigs_paused_only_when_active check (not is_paused or status = 'active');

alter table public.applications
  add column if not exists reviewed_at timestamptz;

create index if not exists gigs_employer_status_idx on public.gigs (employer_id, status, created_at desc);
create index if not exists applications_gig_pending_idx on public.applications (gig_id, status, created_at asc);

create or replace function public.enforce_safe_gig()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  candidate text := lower(concat_ws(' ', new.title, new.description, new.category));
begin
  if candidate ~ '(high[ -]?voltage|live[ -]?wire|heavy[ -]?construction|high[ -]?altitude|كهرباء[[:space:]]+جهد[[:space:]]+عال|أسلاك[[:space:]]+مكشوفة|بناء[[:space:]]+ثقيل|ارتفاع[[:space:]]+عال)' then
    raise exception using errcode = '23514', message = 'HAZARDOUS_GIG_BLOCKED';
  end if;
  new.updated_at := timezone('utc', now());
  if new.status = 'active' and new.published_at is null then
    new.published_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists gigs_enforce_safe_content on public.gigs;
create trigger gigs_enforce_safe_content
before insert or update on public.gigs
for each row execute procedure public.enforce_safe_gig();

create or replace function public.review_employer_application(
  p_application_id uuid,
  p_decision public.application_status
)
returns public.applications
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_application public.applications%rowtype;
  target_gig public.gigs%rowtype;
  accepted_count integer;
begin
  if p_decision not in ('accepted'::public.application_status, 'rejected'::public.application_status) then
    raise exception using errcode = '22023', message = 'INVALID_APPLICATION_DECISION';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'employer'::public.user_role
  ) then
    raise exception using errcode = '42501', message = 'EMPLOYER_ROLE_REQUIRED';
  end if;

  select * into target_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'APPLICATION_NOT_FOUND';
  end if;

  select * into target_gig
  from public.gigs
  where id = target_application.gig_id
  for update;

  if target_gig.employer_id <> (select auth.uid()) then
    raise exception using errcode = '42501', message = 'GIG_OWNERSHIP_REQUIRED';
  end if;

  if target_application.status <> 'pending'::public.application_status then
    raise exception using errcode = 'P0001', message = 'APPLICATION_ALREADY_REVIEWED';
  end if;

  if p_decision = 'accepted'::public.application_status then
    select count(*) into accepted_count
    from public.applications
    where gig_id = target_gig.id and status = 'accepted'::public.application_status;

    if accepted_count >= target_gig.acceptance_limit then
      raise exception using errcode = 'P0001', message = 'ACCEPTANCE_LIMIT_REACHED';
    end if;
  end if;

  update public.applications
  set status = p_decision, reviewed_at = timezone('utc', now())
  where id = target_application.id
  returning * into target_application;

  if p_decision = 'accepted'::public.application_status then
    select count(*) into accepted_count
    from public.applications
    where gig_id = target_gig.id and status = 'accepted'::public.application_status;

    if accepted_count >= target_gig.acceptance_limit then
      update public.gigs
      set status = 'assigned'::public.gig_status, is_paused = false
      where id = target_gig.id;

      update public.applications
      set status = 'rejected'::public.application_status, reviewed_at = timezone('utc', now())
      where gig_id = target_gig.id and status = 'pending'::public.application_status;
    end if;
  end if;

  return target_application;
end;
$$;

grant update (full_name, phone, city, neighborhood, avatar_url, business_name, business_category, business_description) on public.profiles to authenticated;
revoke update on public.applications from authenticated;
grant execute on function public.review_employer_application(uuid, public.application_status) to authenticated;
