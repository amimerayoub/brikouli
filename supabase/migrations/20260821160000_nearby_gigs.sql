-- Efficient RLS-compatible nearby discovery without exposing private employer data.
alter table public.gigs add column if not exists urgent boolean not null default false;

create index if not exists gigs_active_coordinate_lookup_idx
on public.gigs (latitude, longitude, created_at desc)
where status = 'active' and latitude is not null and longitude is not null;

create or replace function public.get_nearby_gigs(
  p_lat numeric,
  p_lng numeric,
  p_radius_km numeric default 5,
  p_limit integer default 50,
  p_sort text default 'distance',
  p_category text default null,
  p_urgent_only boolean default false,
  p_min_payment numeric default null,
  p_max_payment numeric default null
)
returns table (
  id uuid,
  employer_id uuid,
  employer_name text,
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
  created_at timestamptz,
  distance_meters numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounded_gigs as (
    select
      g.*,
      coalesce(pp.full_name, 'صاحب عمل محلي') as employer_name,
      6371000 * 2 * asin(sqrt(
        power(sin(radians((g.latitude - p_lat) / 2)), 2) +
        cos(radians(p_lat)) * cos(radians(g.latitude)) *
        power(sin(radians((g.longitude - p_lng) / 2)), 2)
      )) as distance_meters
    from public.gigs g
    left join public.public_profiles pp on pp.id = g.employer_id
    where g.status = 'active'
      and g.latitude is not null
      and g.longitude is not null
      and g.latitude between p_lat - (p_radius_km / 111.0) and p_lat + (p_radius_km / 111.0)
      and g.longitude between p_lng - (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.01)))
                          and p_lng + (p_radius_km / (111.0 * greatest(cos(radians(p_lat)), 0.01)))
      and (p_category is null or g.category = p_category)
      and (not p_urgent_only or g.urgent)
      and (p_min_payment is null or g.payment >= p_min_payment)
      and (p_max_payment is null or g.payment <= p_max_payment)
  )
  select id, employer_id, employer_name, title, description, category, city, neighborhood,
         latitude, longitude, payment, payment_type, duration, urgent, created_at, distance_meters
  from bounded_gigs
  where distance_meters <= p_radius_km * 1000
  order by
    case when p_sort = 'newest' then created_at end desc,
    case when p_sort = 'highest_pay' then payment end desc,
    distance_meters asc
  limit greatest(1, least(p_limit, 100));
$$;

revoke all on function public.get_nearby_gigs(numeric, numeric, numeric, integer, text, text, boolean, numeric, numeric) from public;
grant execute on function public.get_nearby_gigs(numeric, numeric, numeric, integer, text, text, boolean, numeric, numeric) to anon, authenticated;
