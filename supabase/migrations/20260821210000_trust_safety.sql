-- Phase 8: Trust, rating, reporting, blocking, moderation, and audit foundation.

create type public.gig_moderation_risk as enum ('safe', 'review', 'blocked');

alter table public.ratings add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.reports add column if not exists description text check (description is null or char_length(description) between 4 and 1500);
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolved_by uuid references public.profiles(id) on delete set null;
alter table public.gigs add column if not exists moderation_risk public.gig_moderation_risk not null default 'safe';
alter table public.gigs add column if not exists moderation_matches text[] not null default '{}';
alter table public.gigs add column if not exists moderated_at timestamptz not null default timezone('utc', now());

alter table public.ratings drop constraint if exists ratings_gig_id_from_user_to_user_key;
alter table public.ratings add constraint ratings_one_submission_per_gig check (from_user <> to_user);
create unique index if not exists ratings_one_direction_per_gig_idx on public.ratings (gig_id, from_user);
create index if not exists ratings_target_stars_idx on public.ratings (to_user, stars, created_at desc);
create unique index if not exists reports_open_duplicate_idx on public.reports (reporter_id, target_type, target_id) where status in ('open', 'reviewing');
create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at desc);
create index if not exists gigs_moderation_idx on public.gigs (moderation_risk, status, created_at desc);

create table public.trust_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('gig_completed', 'rating_submitted', 'report_created', 'user_blocked', 'user_unblocked', 'gig_moderated', 'gig_publish_blocked')),
  target_type text not null check (target_type in ('gig', 'rating', 'report', 'profile', 'block', 'moderation')),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index trust_audit_log_target_idx on public.trust_audit_log (target_type, target_id, created_at desc);
create index trust_audit_log_actor_idx on public.trust_audit_log (actor_id, created_at desc);
alter table public.trust_audit_log enable row level security;

create or replace function public.normalize_safety_text(p_value text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(regexp_replace(translate(lower(coalesce(p_value, '')), 'أإآٱىةؤئـ', 'اااايهوي'), '[^[:alnum:]\s]+', ' ', 'g'), '\s+', ' ', 'g')
$$;

create or replace function public.assess_gig_moderation(p_title text, p_description text, p_category text)
returns table (risk public.gig_moderation_risk, matches text[])
language plpgsql stable security definer set search_path = '' as $$
declare content text := public.normalize_safety_text(concat_ws(' ', p_title, p_description, p_category));
declare blocked_rules text[] := '{}';
declare review_rules text[] := '{}';
begin
  if content ~ '(جهد عال[ي]?|كهرباء.*عال[ي]?|اسلاك مكشوفة|متفجرات|تفجير|مواد متفجرة|high voltage|live wire|explosives)' then blocked_rules := array_append(blocked_rules, 'critical_electrical_or_explosive'); end if;
  if content ~ '(هدم ثقيل|حفريات عميقة|ماكينة خطرة|منشار صناعي|heavy construction|dangerous machinery)' then blocked_rules := array_append(blocked_rules, 'heavy_construction_or_machinery'); end if;
  if content ~ '(سقالة|ارتفاع|سطح مرتفع|تسلق|رافعة|غاز|كهرباء|آلة ثقيلة|معدات ثقيلة|high altitude|scaffold|crane)' then review_rules := array_append(review_rules, 'height_energy_or_heavy_equipment'); end if;
  if cardinality(blocked_rules) > 0 then return query select 'blocked'::public.gig_moderation_risk, blocked_rules; return; end if;
  if cardinality(review_rules) > 0 then return query select 'review'::public.gig_moderation_risk, review_rules; return; end if;
  return query select 'safe'::public.gig_moderation_risk, '{}'::text[];
end;
$$;

create or replace function public.apply_gig_moderation()
returns trigger language plpgsql security definer set search_path = '' as $$
declare result record;
begin
  select * into result from public.assess_gig_moderation(new.title, new.description, new.category);
  new.moderation_risk := result.risk; new.moderation_matches := result.matches; new.moderated_at := timezone('utc', now());
  if result.risk = 'blocked'::public.gig_moderation_risk and new.status = 'active'::public.gig_status then
    insert into public.trust_audit_log (actor_id, action, target_type, target_id, metadata) values ((select auth.uid()), 'gig_publish_blocked', 'gig', new.id, jsonb_build_object('risk', result.risk));
    raise exception using errcode = 'P0001', message = 'GIG_MODERATION_BLOCKED';
  end if;
  if result.risk = 'review'::public.gig_moderation_risk and new.status = 'active'::public.gig_status then
    new.status := 'draft'::public.gig_status; new.published_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists gigs_apply_moderation on public.gigs;
create trigger gigs_apply_moderation before insert or update of title, description, category, status on public.gigs for each row execute procedure public.apply_gig_moderation();

create or replace function public.enforce_gig_transition()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is not distinct from new.status then return new; end if;
  if old.employer_id <> (select auth.uid()) and not public.is_admin() then raise exception using errcode = '42501', message = 'GIG_OWNER_REQUIRED'; end if;
  if old.status = 'draft'::public.gig_status and new.status in ('active'::public.gig_status, 'cancelled'::public.gig_status) then return new; end if;
  if old.status = 'active'::public.gig_status and new.status in ('assigned'::public.gig_status, 'cancelled'::public.gig_status) then
    if new.status = 'assigned'::public.gig_status and not exists (select 1 from public.applications where gig_id = old.id and status = 'accepted'::public.application_status) then raise exception using errcode = 'P0001', message = 'ACCEPTED_APPLICATION_REQUIRED'; end if;
    return new;
  end if;
  if old.status = 'assigned'::public.gig_status and new.status = 'completed'::public.gig_status and current_setting('app.allow_gig_completion', true) = 'true' then return new; end if;
  raise exception using errcode = 'P0001', message = 'INVALID_GIG_STATUS_TRANSITION';
end;
$$;
drop trigger if exists gigs_enforce_transition on public.gigs;
create trigger gigs_enforce_transition before update of status on public.gigs for each row execute procedure public.enforce_gig_transition();

create or replace function public.complete_owned_gig(p_gig_id uuid)
returns public.gigs language plpgsql security definer set search_path = '' as $$
declare target public.gigs%rowtype; hired_id uuid;
begin
  select * into target from public.gigs where id = p_gig_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'GIG_NOT_FOUND'; end if;
  if target.employer_id <> (select auth.uid()) then raise exception using errcode = '42501', message = 'GIG_OWNER_REQUIRED'; end if;
  if target.status <> 'assigned'::public.gig_status then raise exception using errcode = 'P0001', message = 'GIG_NOT_ASSIGNED'; end if;
  select applicant_id into hired_id from public.applications where gig_id = target.id and status = 'accepted'::public.application_status limit 1;
  if hired_id is null then raise exception using errcode = 'P0001', message = 'ACCEPTED_APPLICATION_REQUIRED'; end if;
  perform set_config('app.allow_gig_completion', 'true', true);
  update public.gigs set status = 'completed'::public.gig_status where id = target.id returning * into target;
  update public.profiles set completed_jobs = completed_jobs + 1 where id in (target.employer_id, hired_id);
  insert into public.trust_audit_log (actor_id, action, target_type, target_id, metadata) values ((select auth.uid()), 'gig_completed', 'gig', target.id, jsonb_build_object('job_seeker_id', hired_id));
  return target;
end;
$$;

create or replace function public.submit_completion_rating(p_gig_id uuid, p_to_user uuid, p_stars smallint, p_comment text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target public.gigs%rowtype; hired_id uuid; new_rating_id uuid; calculated_rating numeric;
begin
  if p_stars < 1 or p_stars > 5 then raise exception using errcode = '22023', message = 'RATING_STARS_INVALID'; end if;
  select * into target from public.gigs where id = p_gig_id;
  if not found or target.status <> 'completed'::public.gig_status then raise exception using errcode = 'P0001', message = 'RATING_NOT_ALLOWED'; end if;
  select applicant_id into hired_id from public.applications where gig_id = target.id and status = 'accepted'::public.application_status limit 1;
  if (select auth.uid()) = p_to_user or not (((select auth.uid()) = target.employer_id and p_to_user = hired_id) or ((select auth.uid()) = hired_id and p_to_user = target.employer_id)) then raise exception using errcode = '42501', message = 'RATING_NOT_ALLOWED'; end if;
  if exists (select 1 from public.ratings where gig_id = p_gig_id and from_user = (select auth.uid())) then raise exception using errcode = '23505', message = 'RATING_ALREADY_SUBMITTED'; end if;
  insert into public.ratings (gig_id, from_user, to_user, stars, comment) values (p_gig_id, (select auth.uid()), p_to_user, p_stars, nullif(btrim(p_comment), '')) returning id into new_rating_id;
  select round(avg(stars)::numeric, 1) into calculated_rating from public.ratings where to_user = p_to_user;
  update public.profiles set rating = coalesce(calculated_rating, 0) where id = p_to_user;
  insert into public.trust_audit_log (actor_id, action, target_type, target_id, metadata) values ((select auth.uid()), 'rating_submitted', 'rating', new_rating_id, jsonb_build_object('gig_id', p_gig_id, 'to_user', p_to_user));
  return new_rating_id;
end;
$$;

create or replace function public.create_private_report(p_target_type text, p_target_id uuid, p_reason text, p_description text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_report_id uuid; target_exists boolean := false;
begin
  if p_target_type not in ('profile', 'gig', 'application', 'rating', 'conversation', 'message') then raise exception using errcode = '22023', message = 'REPORT_TARGET_INVALID'; end if;
  select case p_target_type when 'profile' then exists(select 1 from public.profiles where id=p_target_id) when 'gig' then exists(select 1 from public.gigs where id=p_target_id) when 'application' then exists(select 1 from public.applications a join public.gigs g on g.id=a.gig_id where a.id=p_target_id and (a.applicant_id=(select auth.uid()) or g.employer_id=(select auth.uid()))) when 'rating' then exists(select 1 from public.ratings where id=p_target_id) when 'conversation' then exists(select 1 from public.conversation_members where conversation_id=p_target_id and user_id=(select auth.uid())) when 'message' then exists(select 1 from public.messages m join public.conversation_members cm on cm.conversation_id=m.conversation_id where m.id=p_target_id and cm.user_id=(select auth.uid())) else false end into target_exists;
  if not target_exists then raise exception using errcode = '42501', message = 'REPORT_TARGET_NOT_AVAILABLE'; end if;
  if exists (select 1 from public.reports where reporter_id=(select auth.uid()) and target_type=p_target_type and target_id=p_target_id and status in ('open','reviewing')) then raise exception using errcode = '23505', message = 'REPORT_ALREADY_SUBMITTED'; end if;
  insert into public.reports (reporter_id, target_type, target_id, reason, description) values ((select auth.uid()), p_target_type, p_target_id, p_reason, nullif(btrim(p_description), '')) returning id into new_report_id;
  insert into public.trust_audit_log (actor_id, action, target_type, target_id, metadata) values ((select auth.uid()), 'report_created', 'report', new_report_id, jsonb_build_object('reported_type', p_target_type, 'reported_id', p_target_id));
  return new_report_id;
end;
$$;

create or replace function public.set_private_user_block(p_blocked_id uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_blocked_id = (select auth.uid()) then raise exception using errcode = '22023', message = 'CANNOT_BLOCK_SELF'; end if;
  if not exists (select 1 from public.profiles where id=p_blocked_id) then raise exception using errcode = 'P0002', message = 'PROFILE_NOT_FOUND'; end if;
  if p_blocked then
    insert into public.user_blocks (blocker_id, blocked_id) values ((select auth.uid()), p_blocked_id) on conflict do nothing;
    insert into public.trust_audit_log (actor_id, action, target_type, target_id) values ((select auth.uid()), 'user_blocked', 'block', p_blocked_id);
  else
    delete from public.user_blocks where blocker_id=(select auth.uid()) and blocked_id=p_blocked_id;
    insert into public.trust_audit_log (actor_id, action, target_type, target_id) values ((select auth.uid()), 'user_unblocked', 'block', p_blocked_id);
  end if;
end;
$$;

drop policy if exists "ratings_create_after_completed_gig" on public.ratings;
drop policy if exists "reports_create_self" on public.reports;
drop policy if exists "applications_create_by_applicant" on public.applications;
create policy "applications_create_unblocked_active_gig" on public.applications for insert with check (
  applicant_id = (select auth.uid()) and status = 'pending'::public.application_status and exists (select 1 from public.gigs g where g.id = applications.gig_id and g.status = 'active'::public.gig_status and g.employer_id <> (select auth.uid())) and not exists (select 1 from public.gigs g join public.user_blocks b on g.id = applications.gig_id where (b.blocker_id = g.employer_id and b.blocked_id = (select auth.uid())) or (b.blocker_id = (select auth.uid()) and b.blocked_id = g.employer_id))
);

revoke insert, update, delete on public.ratings, public.reports, public.user_blocks from authenticated;
grant select on public.ratings, public.reports, public.user_blocks to authenticated;
grant execute on function public.complete_owned_gig(uuid) to authenticated;
grant execute on function public.submit_completion_rating(uuid, uuid, smallint, text) to authenticated;
grant execute on function public.create_private_report(text, uuid, text, text) to authenticated;
grant execute on function public.set_private_user_block(uuid, boolean) to authenticated;
revoke execute on function public.normalize_safety_text(text), public.assess_gig_moderation(text, text, text), public.apply_gig_moderation(), public.enforce_gig_transition() from public, anon, authenticated;
revoke execute on function public.complete_owned_gig(uuid), public.submit_completion_rating(uuid, uuid, smallint, text), public.create_private_report(text, uuid, text, text), public.set_private_user_block(uuid, boolean) from public, anon;
