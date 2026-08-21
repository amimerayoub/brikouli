-- Phase 9: isolated Super Admin foundation. All privileged commands require public.is_admin().
do $$ begin create type public.account_status as enum ('active', 'suspended', 'blocked'); exception when duplicate_object then null; end $$;
do $$ begin create type public.sponsored_gig_status as enum ('active', 'paused', 'expired'); exception when duplicate_object then null; end $$;
do $$ begin create type public.admin_moderation_state as enum ('pending', 'reviewing', 'approved', 'rejected', 'blocked'); exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists account_status public.account_status not null default 'active';
alter table public.profiles add column if not exists account_status_updated_at timestamptz not null default timezone('utc', now());
alter table public.gigs add column if not exists admin_moderation_state public.admin_moderation_state not null default 'approved';
alter table public.gigs add column if not exists admin_moderation_note text check (admin_moderation_note is null or char_length(admin_moderation_note) <= 800);
update public.gigs set admin_moderation_state = case when moderation_risk = 'review'::public.gig_moderation_risk then 'pending'::public.admin_moderation_state when moderation_risk = 'blocked'::public.gig_moderation_risk then 'blocked'::public.admin_moderation_state else 'approved'::public.admin_moderation_state end where admin_moderation_state = 'approved'::public.admin_moderation_state;

create table if not exists public.sponsored_gigs (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null unique references public.gigs(id) on delete cascade,
  status public.sponsored_gig_status not null default 'paused',
  start_at timestamptz not null,
  end_at timestamptz not null,
  priority integer not null check (priority between 1 and 100),
  impressions integer not null default 0 check (impressions >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_at > start_at)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 3 and 120),
  target_type text not null check (char_length(target_type) between 2 and 80),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  safe_identifier text check (safe_identifier is null or char_length(safe_identifier) <= 160),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_admin_status_idx on public.profiles (account_status, role, created_at desc);
create index if not exists gigs_admin_status_category_idx on public.gigs (status, category, created_at desc);
create index if not exists reports_admin_status_type_idx on public.reports (status, target_type, created_at desc);
create index if not exists sponsored_gigs_status_end_idx on public.sponsored_gigs (status, end_at asc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs (action, created_at desc);
create index if not exists admin_audit_logs_target_idx on public.admin_audit_logs (target_type, target_id, created_at desc);

alter table public.sponsored_gigs enable row level security;
alter table public.admin_audit_logs enable row level security;
create policy "sponsored_gigs_admin_only" on public.sponsored_gigs for all using (public.is_admin()) with check (public.is_admin());
create policy "admin_audit_logs_admin_only" on public.admin_audit_logs for select using (public.is_admin());

revoke update (role, rating, completed_jobs, accepted_terms, accepted_terms_at, created_at, updated_at, account_status, account_status_updated_at) on public.profiles from authenticated;
revoke insert, update, delete on public.sponsored_gigs, public.admin_audit_logs from authenticated;
revoke select on public.sponsored_gigs, public.admin_audit_logs from anon;
grant select on public.sponsored_gigs, public.admin_audit_logs to authenticated;

create or replace function public.is_active_account()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and account_status = 'active'::public.account_status)
$$;

create or replace function public.enforce_active_account_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_admin() or public.is_active_account() then return new; end if;
  raise exception using errcode = '42501', message = 'ACCOUNT_NOT_ACTIVE';
end;
$$;
drop trigger if exists applications_require_active_account on public.applications;
create trigger applications_require_active_account before insert or update on public.applications for each row execute procedure public.enforce_active_account_write();
drop trigger if exists gigs_require_active_account on public.gigs;
create trigger gigs_require_active_account before insert or update on public.gigs for each row execute procedure public.enforce_active_account_write();
drop trigger if exists messages_require_active_account on public.messages;
create trigger messages_require_active_account before insert on public.messages for each row when (new.sender_id is not null) execute procedure public.enforce_active_account_write();

create or replace function public.write_admin_audit(p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  insert into public.admin_audit_logs (actor_id, action, target_type, target_id, metadata)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

create or replace function public.admin_set_account_status(p_user_id uuid, p_status public.account_status, p_reason text default null)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare target public.profiles%rowtype;
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  if p_user_id = (select auth.uid()) then raise exception using errcode = '42501', message = 'ADMIN_SELF_ACTION_FORBIDDEN'; end if;
  select * into target from public.profiles where id = p_user_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'PROFILE_NOT_FOUND'; end if;
  if target.role = 'admin'::public.user_role then raise exception using errcode = '42501', message = 'ADMIN_TARGET_FORBIDDEN'; end if;
  update public.profiles set account_status = p_status, account_status_updated_at = timezone('utc', now()) where id = p_user_id returning * into target;
  perform public.write_admin_audit('account_' || p_status::text, 'profile', p_user_id, jsonb_build_object('reason', nullif(btrim(p_reason), '')));
  return target;
end;
$$;

create or replace function public.apply_gig_moderation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare result record;
begin
  select * into result from public.assess_gig_moderation(new.title, new.description, new.category);
  new.moderation_risk := result.risk; new.moderation_matches := result.matches; new.moderated_at := timezone('utc', now());
  if result.risk = 'blocked'::public.gig_moderation_risk and new.status = 'active'::public.gig_status then
    new.admin_moderation_state := 'blocked'::public.admin_moderation_state;
    insert into public.trust_audit_log (actor_id, action, target_type, target_id, metadata) values ((select auth.uid()), 'gig_publish_blocked', 'gig', new.id, jsonb_build_object('risk', result.risk));
    raise exception using errcode = 'P0001', message = 'GIG_MODERATION_BLOCKED';
  end if;
  if result.risk = 'review'::public.gig_moderation_risk and new.status = 'active'::public.gig_status and current_setting('app.allow_admin_review_approval', true) <> 'true' then
    new.status := 'draft'::public.gig_status; new.published_at := null; new.admin_moderation_state := 'pending'::public.admin_moderation_state;
  end if;
  return new;
end;
$$;

create or replace function public.admin_moderate_gig(p_gig_id uuid, p_action text, p_note text default null)
returns public.gigs language plpgsql security definer set search_path = '' as $$
declare target public.gigs%rowtype;
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  if p_action not in ('approve','reject','suspend','remove','request_changes','block') then raise exception using errcode = '22023', message = 'ADMIN_GIG_ACTION_INVALID'; end if;
  select * into target from public.gigs where id = p_gig_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'GIG_NOT_FOUND'; end if;
  if p_action = 'approve' then
    if target.moderation_risk = 'blocked'::public.gig_moderation_risk then raise exception using errcode = '42501', message = 'BLOCKED_GIG_CANNOT_BE_APPROVED'; end if;
    perform set_config('app.allow_admin_review_approval', 'true', true);
    update public.gigs set status = 'active', is_paused = false, admin_moderation_state = 'approved', admin_moderation_note = nullif(btrim(p_note), ''), published_at = coalesce(published_at, timezone('utc', now())) where id = p_gig_id returning * into target;
  elsif p_action = 'suspend' then
    update public.gigs set is_paused = true, admin_moderation_state = 'reviewing', admin_moderation_note = nullif(btrim(p_note), '') where id = p_gig_id returning * into target;
  elsif p_action = 'request_changes' then
    update public.gigs set status = 'draft', is_paused = true, admin_moderation_state = 'reviewing', admin_moderation_note = nullif(btrim(p_note), '') where id = p_gig_id returning * into target;
  elsif p_action = 'reject' then
    update public.gigs set status = 'cancelled', is_paused = true, admin_moderation_state = 'rejected', admin_moderation_note = nullif(btrim(p_note), '') where id = p_gig_id returning * into target;
  else
    update public.gigs set status = 'cancelled', is_paused = true, admin_moderation_state = 'blocked', admin_moderation_note = nullif(btrim(p_note), '') where id = p_gig_id returning * into target;
  end if;
  perform public.write_admin_audit('gig_' || p_action, 'gig', p_gig_id, jsonb_build_object('risk', target.moderation_risk, 'note', nullif(btrim(p_note), '')));
  return target;
end;
$$;

create or replace function public.admin_review_report(p_report_id uuid, p_action text, p_note text default null)
returns public.reports language plpgsql security definer set search_path = '' as $$
declare target public.reports%rowtype; next_status public.report_status;
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  if p_action not in ('review','resolve','dismiss') then raise exception using errcode = '22023', message = 'ADMIN_REPORT_ACTION_INVALID'; end if;
  select * into target from public.reports where id = p_report_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'REPORT_NOT_FOUND'; end if;
  next_status := case p_action when 'review' then 'reviewing'::public.report_status when 'resolve' then 'resolved'::public.report_status else 'dismissed'::public.report_status end;
  update public.reports set status = next_status, resolved_by = case when next_status in ('resolved','dismissed') then (select auth.uid()) else null end, resolved_at = case when next_status in ('resolved','dismissed') then timezone('utc', now()) else null end where id = p_report_id returning * into target;
  perform public.write_admin_audit('report_' || p_action, 'report', p_report_id, jsonb_build_object('target_type', target.target_type, 'note', nullif(btrim(p_note), '')));
  return target;
end;
$$;

create or replace function public.admin_create_sponsored_gig(p_gig_id uuid, p_start_at timestamptz, p_end_at timestamptz, p_priority integer)
returns public.sponsored_gigs language plpgsql security definer set search_path = '' as $$
declare target public.sponsored_gigs%rowtype;
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  if p_end_at <= p_start_at or p_priority < 1 or p_priority > 100 then raise exception using errcode = '22023', message = 'SPONSORED_INPUT_INVALID'; end if;
  if not exists (select 1 from public.gigs where id = p_gig_id and status = 'active'::public.gig_status) then raise exception using errcode = 'P0001', message = 'ACTIVE_GIG_REQUIRED'; end if;
  insert into public.sponsored_gigs (gig_id, status, start_at, end_at, priority) values (p_gig_id, 'paused'::public.sponsored_gig_status, p_start_at, p_end_at, p_priority) on conflict (gig_id) do update set start_at = excluded.start_at, end_at = excluded.end_at, priority = excluded.priority, updated_at = timezone('utc', now()) returning * into target;
  perform public.write_admin_audit('sponsored_created', 'sponsored_gig', target.id, jsonb_build_object('gig_id', p_gig_id, 'priority', p_priority));
  return target;
end;
$$;

create or replace function public.admin_set_sponsored_status(p_sponsored_id uuid, p_status public.sponsored_gig_status)
returns public.sponsored_gigs language plpgsql security definer set search_path = '' as $$
declare target public.sponsored_gigs%rowtype;
begin
  if not public.is_admin() then raise exception using errcode = '42501', message = 'ADMIN_REQUIRED'; end if;
  select * into target from public.sponsored_gigs where id = p_sponsored_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'SPONSORED_NOT_FOUND'; end if;
  if p_status = 'active'::public.sponsored_gig_status and (target.start_at > timezone('utc', now()) or target.end_at <= timezone('utc', now())) then raise exception using errcode = 'P0001', message = 'SPONSORED_WINDOW_INVALID'; end if;
  update public.sponsored_gigs set status = p_status, updated_at = timezone('utc', now()) where id = p_sponsored_id returning * into target;
  perform public.write_admin_audit('sponsored_' || p_status::text, 'sponsored_gig', p_sponsored_id, jsonb_build_object('gig_id', target.gig_id));
  return target;
end;
$$;

grant execute on function public.admin_set_account_status(uuid, public.account_status, text), public.admin_moderate_gig(uuid, text, text), public.admin_review_report(uuid, text, text), public.admin_create_sponsored_gig(uuid, timestamptz, timestamptz, integer), public.admin_set_sponsored_status(uuid, public.sponsored_gig_status) to authenticated;
revoke execute on function public.is_active_account(), public.enforce_active_account_write(), public.write_admin_audit(text, text, uuid, jsonb), public.admin_set_account_status(uuid, public.account_status, text), public.admin_moderate_gig(uuid, text, text), public.admin_review_report(uuid, text, text), public.admin_create_sponsored_gig(uuid, timestamptz, timestamptz, integer), public.admin_set_sponsored_status(uuid, public.sponsored_gig_status) from public, anon;
