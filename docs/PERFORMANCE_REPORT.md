# Brikouli — Phase 10 Performance Report

## Method

This report records production-build output from the existing Vite application. Values are minified asset sizes from the local production build; they are not a field measurement of real-user network time. The purpose is to make code-splitting decisions explicit and repeatable.

| Optimization | Implementation | Result |
| --- | --- | --- |
| Explore route boundary | `Explore` is loaded lazily from `App.tsx`. | Discovery UI is emitted as an independent route chunk. |
| Admin route boundaries | Each administrator page is loaded lazily behind the isolated Admin shell. | Administrative pages are not eagerly included with public discovery work. |
| Map boundary | MapLibre remains a lazy dependency with its own style and JavaScript chunks. | The heavyweight map renderer is not requested until the Explore route needs it. |
| Stable vendor groups | Vite `manualChunks` separates React, data/tRPC/TanStack and MapLibre dependencies. | Large long-lived dependencies can be cached independently across content updates. |
| Public metadata | `robots.txt`, sitemap, manifest and metadata live in Vite’s public directory. | Search and install metadata add no runtime API requests. |

## Build comparison

| Asset group | Before stable vendor grouping | After stable vendor grouping | Interpretation |
| --- | ---: | ---: | --- |
| Primary application chunk | 1,361.59 kB / 346.50 kB gzip | 788.85 kB / 176.31 kB gzip | App-specific code is substantially smaller and can evolve separately. |
| React vendor | Included in primary chunk | 459.21 kB / 133.32 kB gzip | A stable shared dependency with improved cache reuse. |
| Data vendor | Included in primary chunk | 101.23 kB / 28.27 kB gzip | tRPC, TanStack Query and serialization utilities are independently cacheable. |
| Explore route | 37.62 kB / 7.15 kB gzip | 35.07 kB / 6.39 kB gzip | Discovery view is deferred until visited. |
| MapLibre route dependency | 986.97 kB / 258.08 kB gzip | 1,004.18 kB / 264.21 kB gzip | Still intentionally deferred; its size reflects the renderer and worker dependency. |

The primary JavaScript reduction should not be interpreted as a reduction in total application bytes for a first visit to every route. It is a delivery and caching improvement: users who do not open Explore or Admin routes avoid those chunks, and returning users can reuse stable vendor files.

## Remaining considerations

MapLibre is the largest intentional dependency. It should remain lazy. Further reduction would require changing map capabilities or selecting a materially different renderer, neither of which is appropriate for Phase 10. The Vite warning remains because the deferred MapLibre chunk exceeds the default 500 kB threshold; the warning is acknowledged and does not indicate a build failure.

The primary `index.html` is also relatively large because generated styling and current runtime assets are inlined or referenced by the existing delivery setup. Further work should begin with real-user measurements and route-specific profiling rather than blindly removing accessibility, localization, or map functionality.

## Query and database discipline

Phase 10 adds indexes for owner-scoped notification reads and recent search telemetry. The post-migration Supabase performance advisor also identified uncovered foreign keys, so `20260822220000_phase10_performance_indexes.sql` was applied to index the referenced sides of audit, conversation, favorite, message, rating, report, search-event and block relationships. The advisor no longer reports uncovered foreign keys.

The refreshed advisor continues to label a number of indexes as unused. The project does not yet have representative production traffic, so those **informational** observations are not a safe reason to remove workflow or foreign-key indexes. Re-evaluate them after sustained live traffic and a query-plan review. Search ranking, recommendation and administrator aggregation use narrow projections and bounded result sets.

## Validation record

The post-optimization production build completed successfully, and TypeScript checking completed with zero errors. Focused Phase 10 notification, foundation and administrator-router tests also passed. Full-suite validation and route smoke checks are recorded in the release checkpoint once the final verification phase completes.
