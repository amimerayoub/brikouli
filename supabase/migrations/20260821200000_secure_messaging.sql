-- Phase 7: accepted-application messaging. Conversations are created only by the
-- database when an application transitions to accepted; clients cannot create them.

create type public.conversation_status as enum ('active', 'archived', 'closed');
create type public.chat_message_type as enum ('text', 'voice', 'image', 'system');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete restrict,
  gig_id uuid not null references public.gigs(id) on delete restrict,
  employer_id uuid not null references public.profiles(id) on delete restrict,
  job_seeker_id uuid not null references public.profiles(id) on delete restrict,
  status public.conversation_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (employer_id <> job_seeker_id)
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  archived_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete restrict,
  message_type public.chat_message_type not null,
  content text,
  media_key text,
  media_mime_type text,
  media_size_bytes integer,
  media_duration_ms integer,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  check (char_length(coalesce(content, '')) <= 4000),
  check (media_key is null or char_length(media_key) between 1 and 1024),
  check (media_size_bytes is null or media_size_bytes between 1 and 8388608),
  check (media_duration_ms is null or media_duration_ms between 0 and 30000),
  check (
    (message_type = 'text'::public.chat_message_type and sender_id is not null and char_length(btrim(coalesce(content, ''))) > 0 and media_key is null)
    or (message_type in ('voice'::public.chat_message_type, 'image'::public.chat_message_type) and sender_id is not null and media_key is not null and media_mime_type is not null and content is null)
    or (message_type = 'system'::public.chat_message_type and sender_id is null and media_key is null)
  )
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index conversations_employer_idx on public.conversations (employer_id, updated_at desc);
create index conversations_job_seeker_idx on public.conversations (job_seeker_id, updated_at desc);
create index conversation_members_user_idx on public.conversation_members (user_id, hidden_at, archived_at);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index user_blocks_blocker_idx on public.user_blocks (blocker_id, created_at desc);

create trigger conversations_set_updated_at before update on public.conversations
for each row execute procedure public.set_updated_at();

create or replace function public.create_accepted_application_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_gig public.gigs%rowtype;
  new_conversation_id uuid;
begin
  if old.status <> 'pending'::public.application_status or new.status <> 'accepted'::public.application_status then
    return new;
  end if;

  select * into target_gig from public.gigs where id = new.gig_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'GIG_NOT_FOUND';
  end if;

  insert into public.conversations (application_id, gig_id, employer_id, job_seeker_id)
  values (new.id, new.gig_id, target_gig.employer_id, new.applicant_id)
  on conflict (application_id) do update set updated_at = excluded.updated_at
  returning id into new_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (new_conversation_id, target_gig.employer_id), (new_conversation_id, new.applicant_id)
  on conflict do nothing;

  insert into public.messages (conversation_id, sender_id, message_type, content)
  values
    (new_conversation_id, null, 'system'::public.chat_message_type, 'تم قبول طلبك.'),
    (new_conversation_id, null, 'system'::public.chat_message_type, 'تم إنشاء المحادثة. احترم خصوصية الطرف الآخر ولا تشارك معلومات حساسة.')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists applications_create_accepted_conversation on public.applications;
create trigger applications_create_accepted_conversation
after update of status on public.applications
for each row execute procedure public.create_accepted_application_conversation();

create or replace function public.touch_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation after insert on public.messages
for each row execute procedure public.touch_conversation_after_message();

create or replace function public.close_owned_conversation(p_conversation_id uuid)
returns public.conversations
language plpgsql
security definer
set search_path = ''
as $$
declare target public.conversations%rowtype;
begin
  select * into target from public.conversations where id = p_conversation_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'CONVERSATION_NOT_FOUND'; end if;
  if (select auth.uid()) not in (target.employer_id, target.job_seeker_id) then raise exception using errcode = '42501', message = 'CONVERSATION_ACCESS_DENIED'; end if;
  update public.conversations set status = 'closed'::public.conversation_status where id = target.id returning * into target;
  insert into public.messages (conversation_id, sender_id, message_type, content) values (target.id, null, 'system'::public.chat_message_type, 'تم إغلاق المحادثة وأصبحت للقراءة فقط.');
  return target;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.conversation_members where conversation_id = p_conversation_id and user_id = (select auth.uid())) then
    raise exception using errcode = '42501', message = 'CONVERSATION_ACCESS_DENIED';
  end if;
  update public.conversation_members set last_read_at = timezone('utc', now()) where conversation_id = p_conversation_id and user_id = (select auth.uid());
  update public.messages set read_at = timezone('utc', now()), delivered_at = coalesce(delivered_at, timezone('utc', now())) where conversation_id = p_conversation_id and sender_id is distinct from (select auth.uid()) and read_at is null;
end;
$$;

grant select on public.conversations, public.conversation_members, public.messages, public.user_blocks to authenticated;
grant insert on public.messages, public.user_blocks to authenticated;
grant update (last_read_at, archived_at, hidden_at) on public.conversation_members to authenticated;
grant delete on public.user_blocks to authenticated;
grant execute on function public.close_owned_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;

create policy "conversations_select_participants" on public.conversations for select to authenticated using ((select auth.uid()) in (employer_id, job_seeker_id) or public.is_admin());
create policy "conversation_members_select_self" on public.conversation_members for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy "conversation_members_update_self" on public.conversation_members for update to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());
create policy "messages_select_participants" on public.messages for select to authenticated using (public.is_admin() or exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = (select auth.uid())));
create policy "messages_insert_active_participant" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and message_type <> 'system'::public.chat_message_type and exists (
    select 1 from public.conversations c where c.id = messages.conversation_id and c.status = 'active'::public.conversation_status and (select auth.uid()) in (c.employer_id, c.job_seeker_id)
  ) and not exists (
    select 1 from public.user_blocks b join public.conversations c on c.id = messages.conversation_id where (b.blocker_id = c.employer_id and b.blocked_id = c.job_seeker_id) or (b.blocker_id = c.job_seeker_id and b.blocked_id = c.employer_id)
  )
);
create policy "user_blocks_manage_self" on public.user_blocks for all to authenticated using (blocker_id = (select auth.uid()) or public.is_admin()) with check (blocker_id = (select auth.uid()) or public.is_admin());

alter table public.reports drop constraint if exists reports_target_type_check;
alter table public.reports add constraint reports_target_type_check check (target_type in ('profile', 'gig', 'application', 'rating', 'conversation', 'message'));

alter publication supabase_realtime add table public.conversations, public.conversation_members, public.messages;

-- Private Presence and Broadcast channels use the topic format `conversation:<conversation-id>`.
-- Public access must also be disabled under Supabase Realtime settings before relying on these policies.
create policy "conversation_realtime_receive" on realtime.messages for select to authenticated using (
  realtime.messages.extension in ('broadcast', 'presence') and exists (
    select 1 from public.conversation_members cm where cm.user_id = (select auth.uid()) and ('conversation:' || cm.conversation_id::text) = (select realtime.topic())
  )
);
create policy "conversation_realtime_send" on realtime.messages for insert to authenticated with check (
  realtime.messages.extension in ('broadcast', 'presence') and exists (
    select 1 from public.conversation_members cm where cm.user_id = (select auth.uid()) and ('conversation:' || cm.conversation_id::text) = (select realtime.topic())
  )
);
