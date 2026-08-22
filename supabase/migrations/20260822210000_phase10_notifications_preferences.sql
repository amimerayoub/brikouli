-- Phase 10: durable preferences, notifications, and privacy-preserving search telemetry.
-- Run through Supabase migration tooling after all prior Brikouli migrations.

do $$ begin
  create type public.notification_type as enum (
    'new_message', 'nearby_gig', 'application_accepted', 'application_rejected',
    'rating_received', 'safety_warning', 'new_applicant'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists availability text not null default 'flexible' check (availability in ('available', 'part_time', 'weekends', 'flexible', 'unavailable')),
  add column if not exists preferred_language text not null default 'ar' check (preferred_language in ('ar', 'fr')),
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists profile_visibility text not null default 'members' check (profile_visibility in ('members', 'public'));

revoke update (skills, availability, preferred_language, notifications_enabled, profile_visibility) on public.profiles from authenticated;
grant update (skills, availability, preferred_language, notifications_enabled, profile_visibility) on public.profiles to authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) between 2 and 180),
  message text not null check (char_length(message) between 2 and 800),
  href text check (href is null or char_length(href) <= 240),
  metadata jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notifications_read_timestamp check ((read and read_at is not null) or not read)
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, read, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
revoke insert, delete, update on public.notifications from authenticated;
grant update (read, read_at) on public.notifications to authenticated;

drop policy if exists "notifications_select_owner_or_admin" on public.notifications;
create policy "notifications_select_owner_or_admin" on public.notifications for select
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "notifications_update_owner_read_state" on public.notifications;
create policy "notifications_update_owner_read_state" on public.notifications for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  query text not null check (char_length(query) between 2 and 120),
  normalized_query text not null check (char_length(normalized_query) between 2 and 120),
  category text,
  city text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists search_events_normalized_created_idx on public.search_events (normalized_query, created_at desc);
create index if not exists search_events_city_created_idx on public.search_events (city, created_at desc) where city is not null;

alter table public.search_events enable row level security;
grant select, insert on public.search_events to authenticated;
drop policy if exists "search_events_insert_self" on public.search_events;
create policy "search_events_insert_self" on public.search_events for insert with check (user_id = (select auth.uid()));
drop policy if exists "search_events_read_admin_only" on public.search_events;
create policy "search_events_read_admin_only" on public.search_events for select using (public.is_admin());

create or replace function public.phase10_notify_application_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_user uuid; target_title text; target_message text; target_href text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    select g.employer_id, 'طلب جديد', 'وصل طلب جديد إلى إحدى فرصك.', '/employer/applicants'
      into target_user, target_title, target_message, target_href from public.gigs g where g.id = new.gig_id;
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.status in ('accepted', 'rejected') then
    target_user := new.applicant_id;
    target_title := case when new.status = 'accepted' then 'تم قبول طلبك' else 'يوجد تحديث على طلبك' end;
    target_message := case when new.status = 'accepted' then 'تم قبول طلبك. يمكنك الآن متابعة تفاصيل المهمة.' else 'تم تحديث حالة طلبك.' end;
    target_href := '/applications';
  else
    return new;
  end if;
  if target_user is not null and exists (select 1 from public.profiles p where p.id = target_user and p.notifications_enabled) then
    insert into public.notifications (user_id, type, title, message, href, metadata)
      values (target_user, case when tg_op = 'INSERT' then 'new_applicant' else case when new.status = 'accepted' then 'application_accepted' else 'application_rejected' end end, target_title, target_message, target_href, jsonb_build_object('application_id', new.id, 'gig_id', new.gig_id));
  end if;
  return new;
end;
$$;

create or replace function public.phase10_notify_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.sender_id is null or new.type = 'system' then return new; end if;
  insert into public.notifications (user_id, type, title, message, href, metadata)
  select cm.user_id, 'new_message', 'رسالة جديدة', case when new.type = 'voice' then 'أرسل لك الطرف الآخر رسالة صوتية.' when new.type = 'image' then 'أرسل لك الطرف الآخر صورة.' else left(coalesce(new.content, 'لديك رسالة جديدة.'), 120) end, '/messages/' || new.conversation_id::text, jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id)
  from public.conversation_members cm join public.profiles p on p.id = cm.user_id
  where cm.conversation_id = new.conversation_id and cm.user_id <> new.sender_id and p.notifications_enabled;
  return new;
end;
$$;

create or replace function public.phase10_notify_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.profiles p where p.id = new.to_user and p.notifications_enabled) then
    insert into public.notifications (user_id, type, title, message, href, metadata)
      values (new.to_user, 'rating_received', 'تلقيت تقييماً جديداً', 'شارك أحد أطراف المهمة تجربته معك.', '/ratings', jsonb_build_object('rating_id', new.id, 'gig_id', new.gig_id));
  end if;
  return new;
end;
$$;

drop trigger if exists phase10_applications_notify on public.applications;
create trigger phase10_applications_notify after insert or update of status on public.applications for each row execute procedure public.phase10_notify_application_change();
drop trigger if exists phase10_messages_notify on public.messages;
create trigger phase10_messages_notify after insert on public.messages for each row execute procedure public.phase10_notify_message();
drop trigger if exists phase10_ratings_notify on public.ratings;
create trigger phase10_ratings_notify after insert on public.ratings for each row execute procedure public.phase10_notify_rating();

revoke all on function public.phase10_notify_application_change() from public, anon, authenticated;
revoke all on function public.phase10_notify_message() from public, anon, authenticated;
revoke all on function public.phase10_notify_rating() from public, anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
