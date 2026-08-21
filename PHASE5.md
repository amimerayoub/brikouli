# Brikouli Phase 5 — key-free mapping migration

Phase 5 removes the failed managed Google Maps path from Brikouli’s active application source and replaces it with **MapLibre GL**, **react-map-gl/maplibre**, the **OpenFreeMap Liberty** style, OpenStreetMap attribution, and a server-mediated Nominatim location search. The existing Arabic RTL discovery UI, Supabase nearby-gig query, geolocation, Haversine distance, filters, marker sheet, authentication, and protected routes are preserved.

| Concern | Phase 5 implementation |
| --- | --- |
| Interactive map | `react-map-gl/maplibre` renders a touch-friendly MapLibre canvas from `https://tiles.openfreemap.org/styles/liberty`; no map key or billing credential is required. |
| Markers | Animated React markers show a category glyph, payment indicator, urgent badge, selected state, and open the existing Bottom Sheet rather than a browser popup. |
| User location | Browser geolocation updates the camera when permission is granted. Denied and unavailable states remain non-blocking. |
| Nearby data | The existing Supabase `get_nearby_gigs` contract remains the sole source for radius, category, urgency, sort, payment, and distance-aware gig results. |
| Search | Nominatim search is server-side, Arabic-aware, Morocco-scoped, cached, rate-limited, and triggered only by an explicit submit action. Recent searches stay in browser storage. |
| Accessibility | Map controls use labelled buttons; map controls, marker sheets, bottom navigation, and filter sheets retain large touch targets and RTL semantics. |

## Nominatim guardrails

The public Nominatim service limits applications to one request per second, requires an identifying User-Agent or Referer, asks applications to cache requests, and prohibits client-side autocomplete. Brikouli therefore makes no request while people type. It uses an explicit search action, server-side cache, an application User-Agent, a one-second request gate, and a configuration boundary that can be moved to another provider later.[1]

## Verification

The OpenFreeMap style endpoint, a Casablanca vector-tile URL, and a Nominatim single-search endpoint each returned HTTP 200 during Phase 5 validation. The desktop `/explore` screenshot was reviewed at 1440 × 1000: its RTL split layout, map controls, OpenFreeMap vector details, attribution, radius filters, and empty nearby-gig state all rendered. The MapLibre canvas initially showed a blank base layer until a post-style-load resize was introduced; it then visibly rendered the Liberty map. A Vite dependency-prebundle exclusion protects MapLibre’s runtime Web Worker in development.

The codebase passes TypeScript checking, production build verification, and its 22-test suite. The Phase 5 tests assert the key-free style configuration, removal of active Google imports, marker-to-sheet wiring, responsive modes, deliberate location-search submission, and radius/category/urgency/sort query inputs. Existing suites continue to cover nearby-query validation, distance, RLS, and authentication.

## Deployment note

This managed repository is a React/Vite/Express application rather than a direct Next.js 15/Vercel project. The MapLibre/OpenFreeMap/Nominatim migration is independent of that hosting runtime and does not depend on Google environment variables or any mapping secret.

## Reference

[1]: https://operations.osmfoundation.org/policies/nominatim/ "Nominatim Usage Policy"
