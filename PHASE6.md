# Phase 6 — Employer Workspace

## Scope and architecture

Phase 6 adds the **Employer Workspace** to Brikouli’s established React 19, Vite, Express, tRPC, Supabase, and MapLibre architecture. It is Arabic-first, RTL, and mobile-first, with a bottom navigation and floating primary action on small screens and a persistent dark-green sidebar on desktop. The implementation deliberately does not introduce an Admin Workspace.

| Area | Delivered capability |
|---|---|
| Access control | Employer role checks occur on the server before every employer service; Supabase RLS and employer-owned RPCs provide a second boundary. |
| Gig lifecycle | Owners can create, edit, pause, resume, cancel, and safely delete only eligible owned gigs. |
| Applicant decisions | Per-gig secure review supports accept and reject flows, with database-side single-hire enforcement. |
| Safety | Server-side schemas and a database trigger reject hazardous work categories and keywords with Arabic feedback. |
| Location | The reusable MapLibre picker supports explicit Nominatim search, current location, map tap, and a draggable marker. |
| Business identity | Employers can update owner, activity, contact, place, description, and optional image-URL fields through a secure RPC. |
| Activity updates | The notification center derives non-realtime grouped cards from the employer’s actual application records and active gigs scheduled for the following day. |

## Employer experience

The Workspace dashboard at `/employer` shows data-backed stat cards, weekly application/gig activity, monthly hires, and quick paths to post a gig, view active work, and review applicants. The post-gig wizard at `/employer/new` keeps job information, MapLibre location selection, compensation, and review/publish as separate steps. A safety warning appears immediately for risky content, while the server remains the authoritative decision point.

Gig management is available at `/employer/gigs`, with lifecycle tabs and owner-scoped actions. Applicant review is available per gig at `/employer/gigs/:gigId/applicants`. The former general Applicants navigation dead end has been replaced with `/employer/applicants`, an overview of only the employer’s gigs that have applications, each linking to its dedicated review queue.

The new `/employer/profile` page presents business identity and real activity statistics, with an edit mode for business name, category, description, owner name, phone, city, neighborhood, and an optional image URL. The new `/employer/notifications` page provides a local read state and groups actual activity into **today** and **earlier**; it does not claim real-time delivery or persist read receipts.

## Data protection model

The schema additions, RLS policies, and database RPCs are in the following migrations. The application UI never directly modifies the protected employer business fields, reviews application state, or deletes gigs.

| Migration | Protection delivered |
|---|---|
| `20260821190000_employer_workspace.sql` | Employer business metadata, gig lifecycle fields, hazardous-work trigger, and single-hire review RPC. |
| `20260821191000_employer_workspace_rls.sql` | Restricted direct profile updates, employer profile update RPC, and tightened application/gig policies. |
| `20260821192000_employer_safe_delete.sql` | Server-mediated hard deletion only for draft or cancelled gigs without applicant history. |

## Verification

The release validation completed with **zero TypeScript errors**, **32 Vitest files / 61 tests passing**, and a successful production build. The focused employer coverage includes invalid-role/ownership boundaries, business profile RPC usage, review and safe-delete lifecycle behavior, hazardous-gig schema validation, shell RTL constraints, notification grouping, and interactive MapLibre location selection for explicit Arabic search, suggestions, current location, and map tapping.

| Verification | Result |
|---|---|
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 32 files and 61 tests. |
| `pnpm build` | Passed. The build reports a non-blocking static-storage URL resolution notice and standard large-chunk advisories for the MapLibre-inclusive client bundle. |
| Desktop protected-route smoke review | Completed for dashboard, profile, notifications, and gigs at 1440 × 1000. |
| Mobile protected-route smoke review | Completed at 390 × 844, followed by shared authentication-frame overflow hardening. |

> **Known verification boundary:** this workspace did not have an authenticated employer session with live employer-owned records available in the preview environment. Login and protected entry behavior were reviewed, while the authenticated dashboard/data visual acceptance remains a follow-up using a real employer account.

## Files introduced for the final Phase 6 work

The closing scope adds `EmployerProfile.tsx`, `EmployerNotifications.tsx`, `EmployerApplicantsOverview.tsx`, the applicant-overview stylesheet, a typed `EmployerNotification` contract, a server-derived notification service and tRPC procedure, notification grouping coverage, and interactive EmployerLocationPicker DOM coverage. Existing employer shell navigation now targets both the dedicated activity center and the working applicants overview.
