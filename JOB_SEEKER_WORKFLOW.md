# Brikouli Job Seeker workflow

This release completes the **Job Seeker-facing** path on Brikouli’s existing React, Vite, Express, tRPC, and Supabase architecture. It deliberately does **not** introduce employer or administrator dashboards. The implementation keeps the Arabic-first, RTL, mobile-first editorial interface and the key-free MapLibre/OpenFreeMap location discovery introduced in Phase 5.

## Workflow coverage

| Journey stage | Implemented behavior | Data boundary |
| --- | --- | --- |
| Home discovery | Live Job Seeker gig query, instant Arabic title search, reusable category chips, recently posted section, loading, empty, and error states. | Public active-gig read model; saved state requires an authenticated Job Seeker. |
| Explore | Separate explicit Nominatim location search, instant nearby gig-title search, radius/category/urgency/sort filters, MapLibre map/list/split views, and saved state in the marker sheet. | Public nearby-gig query plus owner-only favorites mutations. |
| Gig details | Live gig detail, employer context, sticky save/apply actions, application review, success transition, and duplicate-safe error handling. | Public gig detail; protected application and favorites actions. |
| Saved Gigs | Dedicated `/saved` route, authenticated saved-gig listing, explanatory empty/login states, and optimistic remove with rollback. | Supabase `favorites` table under owner-only RLS. |
| Applications | Dedicated `/applications` route with Arabic RTL status tabs for pending, accepted, rejected, and all applications. | Authenticated Job Seeker application history. |
| Profile | Editable live profile fields with real application and saved-gig counts. Rating language stays conservative when no completed jobs exist. | Authenticated `profiles` record plus derived activity counts. |
| Notifications | Dedicated `/notifications` route that derives grouped **today/earlier** activity from real application records; individual and mark-all read state is local to the screen. | No fake alerts, no background generation, and no real-time transport in this release. |

## Persistence and safety

Saved gigs use a dedicated Supabase `favorites` table with a unique `(job_seeker_id, gig_id)` relationship, supporting duplicate-safe owner actions. Favorite query/mutation contracts and application creation are typed with Zod at the tRPC boundary. The application write service maps a PostgreSQL uniqueness conflict to the Arabic response **"سبق أن تقدمت إلى هذه الفرصة."** instead of silently creating a duplicate or showing a generic failure.

The UI uses optimistic cache transformations for Home, MapLibre discovery, and Saved Gigs. A remove/save action updates the visible state immediately, keeps a snapshot of the prior cache entry, restores it on an error, and finally reconciles with the server. The implementation neither seeds marketplace records nor fabricates ratings, reviews, testimonials, application histories, or notifications.

## Location and notification scope

The interactive map remains configured against OpenFreeMap’s Liberty style through MapLibre; Arabic location lookup remains an explicit, rate-limited, server-side Nominatim action. Typing in the location field does not create an autocomplete request. The independent nearby gig-title search and the map marker sheet remain compatible with existing distance, geolocation, category, urgency, and sort controls.

Notification cards are intentionally not a real-time inbox. They are derived from saved application records, grouped by application timestamp, and visually mark a card read locally after it is opened. This is an honest static activity center until a later release adds a durable notification table and a delivery mechanism.

## Verification record

| Check | Result |
| --- | --- |
| TypeScript | `pnpm check` passed with zero errors. |
| Unit and DOM tests | `pnpm test` passed: **26 files, 51 tests**. Coverage includes domain contracts, duplicate application response, search/filter wiring, favorites helper behavior, real-surface optimistic mutation/rollback mocks, notification helpers, notification page states, interactive saved/read affordances, and the Job Details success-sheet route action. |
| Production build | `pnpm build` passed. The bundle retains a non-blocking chunk-size advisory for MapLibre and the application chunk. |
| Mobile review | `/`, `/explore`, `/applications`, `/saved`, `/profile`, and `/notifications` were reviewed at 390 × 844. Anonymous routes correctly presented safe login/empty states. |
| Desktop review | `/`, `/explore`, `/applications`, `/saved`, and `/notifications` were reviewed at 1440 × 1000. The RTL split discovery layout and MapLibre canvas rendered. |

## Known verification limit

The connected development database did not contain active public gigs or an authenticated Job Seeker session during visual review. Consequently, live screenshots validate public discovery, MapLibre, layout, and unauthenticated fallback states; authenticated saved-gig removal, application submission, status changes, profile editing, and activity notifications are additionally covered by typed server tests and jsdom components with controlled query/mutation states. The Job Details success panel itself is rendered in a DOM acceptance test that verifies its **"متابعة طلباتي"** link targets `/applications` and closes the sheet; the live `/applications` review correctly returned the sign-in fallback. A final acceptance pass with a real Job Seeker account and real employer-published gig remains advisable before public launch.
