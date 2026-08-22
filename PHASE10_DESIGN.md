# Phase 10 — Production Foundation and Launch Hardening

## Architecture reality and scope

Brikouli is an Arabic-first RTL **React 19 + Vite + Express + tRPC + Supabase** application. Phase 10 preserves this deployed architecture; references in the product specification to Next.js or Vercel are treated as delivery intent rather than a request to rewrite the application. No existing Supabase Auth, PostgreSQL/RLS, private media, Realtime, MapLibre, Employer Workspace, or isolated Super Admin boundary will be replaced.

## Baseline audit

| Area | Existing foundation | Phase 10 direction |
| --- | --- | --- |
| Discovery | RLS-backed nearby and Job Seeker gig RPCs, MapLibre, Nominatim location search | Add Arabic normalization, synonym/category intent expansion, constrained ranking, and semantic-search preparation without changing the existing route contracts. |
| Trust and moderation | Completion-gated ratings, private reports, blocking, deterministic moderation preview, isolated Admin moderation | Add server-only AI safety analysis as an advisory signal. Human administrator decisions remain authoritative. |
| Messaging | RLS-gated conversations, private media, read state, Realtime inbox invalidation | Add notification event preparation without exposing conversations or media. |
| Notifications | Job Seeker and Employer screens derive local notices from applications/gigs | Add a durable `notifications` model, ownership RLS, server-authored events, persisted read state, and Realtime publication. |
| Profiles and settings | Basic Job Seeker profile, employer business profile, safety/privacy surface | Add user-controlled availability, skills, and preference foundations through protected APIs and a `/settings` route. |
| AI | No independent AI domain layer | Add a server-only, replaceable AI boundary under `server/lib/ai`; clients call typed tRPC procedures only. Deterministic fallbacks retain useful behavior when no AI request is enabled. |
| Observability | Browser/server console and managed runtime logs | Add structured application logger, safe event vocabulary, correlation-ready metadata, and client error capture hooks. |
| Security | RLS, account-state enforcement, protected tRPC procedures, CSP/HSTS, Admin audit logs | Re-run advisor, preserve intended ownership-checked `SECURITY DEFINER` RPCs, add non-secret error logging, and document the remaining Supabase Auth setting. |

## Guardrails

1. **AI calls are server-side only.** No Forge or model credential is exposed to the browser. AI output is schema-validated, rate-aware, advisory, and never the sole moderation or authorization decision.
2. **Database changes are migration-first.** Notifications, profile preference data, indexes, RLS policies, and Realtime publication will be introduced through a chronological Supabase migration and validated as a single dependency-aware unit.
3. **User-generated evidence is never fabricated.** Recommendations, analytics, events, and notifications operate on real records only; empty-state UX is explicit.
4. **Performance changes are measurable and reversible.** Lazy boundaries, query cache strategy, narrow projections, indexes, and observability are favoured over opaque rewrites.
5. **Security findings are categorized.** Ownership-checked callable RPCs remain intentional where necessary; project-level Supabase settings such as leaked-password protection require owner action and are documented rather than silently bypassed.

## Delivery increments

| Increment | Delivered capability |
| --- | --- |
| A | Arabic search normalization/synonyms, deterministic recommendation scoring, independent AI contract/prompt/moderation foundation, and performance-safe lazy route boundaries. |
| B | Persistent notifications with ownership RLS and read state; realtime-ready event model; user settings/preferences and enriched profile fields. |
| C | Structured monitoring, security/performance audit documentation, SEO public assets, analytics extension, launch/recovery documentation, and final end-to-end verification. |

## Known launch prerequisites outside source code

The current Supabase Auth SMTP configuration rejects confirmation-mail delivery. This must be corrected in Supabase Auth using valid Gmail App Password or a transactional provider before email/password registration can be accepted as a live launch path. Supabase leaked-password protection must also be enabled in project Auth settings before public launch.
