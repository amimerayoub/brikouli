-- Phase 10 advisor-backed foreign-key indexes.
-- Retain existing indexes: advisor "unused" observations are not sufficient to drop
-- protection for recently launched or low-volume production workflows.

create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs (actor_id);
create index if not exists conversations_gig_id_idx on public.conversations (gig_id);
create index if not exists favorites_gig_id_idx on public.favorites (gig_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists ratings_from_user_idx on public.ratings (from_user);
create index if not exists reports_resolved_by_idx on public.reports (resolved_by);
create index if not exists search_events_user_id_idx on public.search_events (user_id);
create index if not exists user_blocks_blocked_id_idx on public.user_blocks (blocked_id);
