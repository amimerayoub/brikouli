-- Phase 5 Job Seeker: public-safe gig projections and authenticated saved-gig reads.

create or replace function public.list_job_seeker_gigs(
  p_query text default null,
  p_category text default null,
  p_urgent_only boolean default false,
  p_sort text default 'newest',
  p_limit integer default 40
)
returns table (
  id uuid,
  employer_id uuid,
  employer_name text,
  employer_avatar_url text,
  title text,
  description text,
  category text,
  city text,
  neighborhood text,
  latitude numeric,
  longitude numeric,
  payment numeric,
  payment_type public.payment_type,
  duration text,
  urgent boolean,
  status public.gig_status,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    g.id, g.employer_id, coalesce(pp.full_name, 'صاحب عمل محلي'), pp.avatar_url,
    g.title, g.description, g.category, g.city, g.neighborhood, g.latitude, g.longitude,
    g.payment, g.payment_type, g.duration, g.urgent, g.status, g.created_at
  from public.gigs g
  left join public.public_profiles pp on pp.id = g.employer_id
  where g.status = 'active'
    and (p_category is null or g.category = p_category)
    and (not p_urgent_only or g.urgent)
    and (
      p_query is null or p_query = '' or
      g.title ilike '%' || p_query || '%' or
      g.category ilike '%' || p_query || '%' or
      g.city ilike '%' || p_query || '%' or
      coalesce(g.neighborhood, '') ilike '%' || p_query || '%'
    )
  order by
    case when p_sort = 'highest_pay' then g.payment end desc,
    case when p_sort = 'newest' then g.created_at end desc,
    g.created_at desc
  limit greatest(1, least(p_limit, 80));
$$;

create or replace function public.get_job_seeker_gig(p_gig_id uuid)
returns table (
  id uuid,
  employer_id uuid,
  employer_name text,
  employer_avatar_url text,
  title text,
  description text,
  category text,
  city text,
  neighborhood text,
  latitude numeric,
  longitude numeric,
  payment numeric,
  payment_type public.payment_type,
  duration text,
  urgent boolean,
  status public.gig_status,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    g.id, g.employer_id, coalesce(pp.full_name, 'صاحب عمل محلي'), pp.avatar_url,
    g.title, g.description, g.category, g.city, g.neighborhood, g.latitude, g.longitude,
    g.payment, g.payment_type, g.duration, g.urgent, g.status, g.created_at
  from public.gigs g
  left join public.public_profiles pp on pp.id = g.employer_id
  where g.id = p_gig_id and g.status = 'active';
$$;

create or replace function public.list_saved_job_seeker_gigs()
returns table (
  id uuid,
  employer_id uuid,
  employer_name text,
  employer_avatar_url text,
  title text,
  description text,
  category text,
  city text,
  neighborhood text,
  latitude numeric,
  longitude numeric,
  payment numeric,
  payment_type public.payment_type,
  duration text,
  urgent boolean,
  status public.gig_status,
  created_at timestamptz,
  saved_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    g.id, g.employer_id, coalesce(pp.full_name, 'صاحب عمل محلي'), pp.avatar_url,
    g.title, g.description, g.category, g.city, g.neighborhood, g.latitude, g.longitude,
    g.payment, g.payment_type, g.duration, g.urgent, g.status, g.created_at, f.created_at
  from public.favorites f
  join public.gigs g on g.id = f.gig_id
  left join public.public_profiles pp on pp.id = g.employer_id
  where f.user_id = (select auth.uid()) and g.status = 'active'
  order by f.created_at desc;
$$;

revoke all on function public.list_job_seeker_gigs(text, text, boolean, text, integer) from public;
revoke all on function public.get_job_seeker_gig(uuid) from public;
revoke all on function public.list_saved_job_seeker_gigs() from public;
grant execute on function public.list_job_seeker_gigs(text, text, boolean, text, integer) to anon, authenticated;
grant execute on function public.get_job_seeker_gig(uuid) to anon, authenticated;
grant execute on function public.list_saved_job_seeker_gigs() to authenticated;
