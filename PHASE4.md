# Brikouli Phase 4 — location foundation

Phase 4 adds a location-aware discovery foundation to Brikouli’s existing Arabic RTL marketplace. It uses the managed maps integration supported by this project rather than introducing a browser-exposed mapping credential. The implementation keeps marketplace data in Supabase and never lets the browser execute SQL.

| Area | Delivered foundation |
| --- | --- |
| Nearby discovery | `public.get_nearby_gigs()` uses a bounded Haversine query, supports 1/3/5/10 km radii, category, urgent, payment, sort, and a maximum result count of 100. |
| Security | The database function uses `SECURITY INVOKER`, preserves the existing active-gig RLS policy, exposes only the safe `public_profiles` projection, and grants execution only to `anon` and `authenticated`. |
| Client location | A non-blocking browser geolocation helper centres the UI when available and gives a clear denied/unavailable state without preventing exploration. |
| Distance | Server and client Haversine helpers return accurate meters and localized display values such as `350 م` and `1.2 كم`. |
| Location search | Arabic city/neighbourhood searches use a validated server-side managed-map proxy action and return typed suggestions. |
| Interface | Reusable map, user-marker, gig-marker, popup, controls, bottom-sheet filters, search suggestions, map/list/split modes, mobile fixed controls, and desktop split layout are implemented. |

## Data contract

Active gigs must have `latitude` and `longitude` to appear in nearby discovery. The Phase 4 migration adds `urgent` and a partial active-coordinate lookup index. The connected Supabase project currently has no active gigs, so the live query correctly returns an empty set; no production data was fabricated.

## Validation

The Phase 4 suite covers Haversine accuracy and formatting, valid and invalid radius/sort/payment filters, Arabic location-search validation, the live bounded Supabase RPC call, and existing RLS/auth tests. The project passes `pnpm check`, `pnpm test`, and production build verification.

## Managed-map status

The managed maps browser script was tested with the project-provided component and credentials but is rejected by the mapping proxy in this development environment (`401`/`403`). At the user’s request, live map activation is now explicitly deferred rather than shown as a failing loader. The reusable interactive adapter, markers, controls, and selection flow remain in the codebase; the interface shows a clear non-blocking deferred-map state while list discovery, filters, nearby queries, and location search remain usable.

## Deferred scope

Chat, employer dashboard, and admin dashboard interfaces remain out of scope. The next product increment can attach real employer-created geocoded gigs, saved locations, and application submission to the existing Supabase/RLS services.
