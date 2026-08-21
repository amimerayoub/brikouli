# Brikouli Phase 3 — interface foundation

Phase 3 transforms the public landing experience into a mobile-first Arabic marketplace interface while retaining the Phase 2 Supabase, server action, and route-protection foundation. It is a **presentation-only** release: no new marketplace writes, map rendering, conversations, employer dashboard UI, or admin dashboard UI have been introduced.

| Route | Phase 3 interface coverage |
| --- | --- |
| `/` | Welcome/search entry, quick-category notices, opportunity continuation, local-nearby placeholder, recent cards, and skeleton loading cards |
| `/explore` | Search presentation, category chips, sorting placeholder, grid/list display, a filter bottom sheet, pagination-ready anchor, and no-results state |
| `/jobs/:jobId` | Hero image, employer trust cues, payment, duration, location placeholder, requirements, safety notice, and fixed action bar |
| `/profile` | User-account overview, profile statistics, settings rows, saved-job state, and application-history state |
| `/messages` | Intentional empty state only; conversation UI remains deferred |

## Reusable interface system

The Phase 3 UI introduces `AppShell`, `AppButton`, `GlassCard`, `SearchField`, `StatusBadge`, `PhaseJobCard`, `BottomSheet`, `ConfirmationDialog`, `EmptyState`, `ErrorState`, and `JobCardSkeleton`. The visual language uses a green-led material system: layered paper opportunity slips, crescent markers, dotted distance dividers, verification stamps, glass navigation, and a restrained use of the editorial display face.

## Responsive behavior

The application uses a five-tab fixed bottom bar in the 360–430px range and moves to a sticky desktop header with top navigation from the tablet breakpoint. Card composition is one column on mobile, two columns at tablet widths, and three-column exploration at wide desktop widths. All primary touch actions meet a 46px baseline, with fixed mobile job actions respecting the safe area.

## Motion and accessibility

Framer Motion controls sheet/dialog transitions and opportunity-card press/hover elevation. CSS transitions remain inside a 160–250ms range and reduce automatically for users who request reduced motion. Screen-reader labels are included for icon-only controls and interactive cards use semantic buttons or links.

## Intentional deferrals

The content data under `client/src/lib/phase3-data.ts` is a local UI fixture only. It is not a marketplace seed or a fake review/testimonial system. The later product phase should replace it with RLS-protected server reads and add confirmed interaction flows for saving, applications, profile editing, and notifications.
