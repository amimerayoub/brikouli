# Phase 9 — Super Admin, Safety Operations, and Security Boundary

Phase 9 adds the **isolated Super Admin system** for Brikouli’s React 19, Vite, Express, tRPC, and Supabase architecture. It preserves the existing managed application rather than creating a separate backend. All administrative pages are Arabic-first, RTL-aware, responsive, and intentionally absent from consumer navigation.

## Privileged boundary

> The absence of an Admin link is a product decision, not an authorization control. Every privileged operation is protected independently of the browser UI.

| Layer | Enforcement |
| --- | --- |
| Route and interface | `/admin` and all child routes render inside `AdminShell`. Unauthenticated visitors receive the existing login flow; authenticated non-admin users receive a no-data forbidden state. Consumer navigation contains no Admin entry. |
| Session and server | `supabaseAdminProcedure` validates the forwarded Supabase access token, obtains the authoritative profile, requires `role = 'admin'`, and rejects non-active administrative accounts. |
| Service and contract | `server/services/admin.ts` independently validates each input with Zod, repeats the authoritative role and account-status lookup, uses constrained projections and server-side pagination, and returns typed safe failures. |
| Database and RLS | Administrative RPCs require `public.is_admin()`; `admin_audit_logs` and `sponsored_gigs` have admin-only RLS; administrative state-change functions are `SECURITY DEFINER` but perform role/ownership checks in SQL. |

This four-layer model means client-supplied role values, cookies, query strings, and request bodies cannot elevate privileges. The browser receives no service-role credential.

## Administrative surfaces

| Route | Purpose |
| --- | --- |
| `/admin` | Live dashboard counts for users, gigs, safety queues, reports, and sponsorships plus recent operational queues. |
| `/admin/users` | Server-paginated name/city search, role/status filters, safe account detail view, and confirmation-gated account activation, suspension, or blocking. |
| `/admin/gigs` | Server-filtered gig review by status, category, and moderation risk; confirmation-gated approve, reject, suspend, remove, and constrained bulk approval controls. |
| `/admin/moderation` | Phase 8 review-risk safety queue with moderation signals and approved administrative actions. |
| `/admin/reports` | Report search and filtered review workflow for supported report target types. |
| `/admin/sponsored` | Sponsored listing creation and activate, pause, or expire status controls. This phase includes **no payment capture or checkout**. |
| `/admin/analytics` | Database-derived thirty-day growth, gig activity, applications, cities, categories, and sponsorship metrics. |
| `/admin/audit-logs` | Searchable and filterable append-only administrative event viewer. |
| `/admin/security` | Account-state counts, repeated-report signal, recent trust activity, and recent administrative actions. |

`AdminShell` uses a dedicated desktop sidebar and a compact mobile navigation drawer. It deliberately does **not** reuse the public bottom navigation. Administrative tables preserve horizontal scrolling only where the data density makes it necessary; high-impact actions use `AdminConfirmDialog`, never browser `alert()` or `confirm()`.

## Data model and enforcement

The applied migrations are `20260821220000_super_admin_foundation.sql` and `20260821221000_admin_helper_grants.sql`.

| Database addition | Security and product purpose |
| --- | --- |
| `profiles.account_status` with `active`, `suspended`, and `blocked` values | Account state is checked by the common protected tRPC procedure and by the Admin procedure. Database triggers prevent non-active accounts from carrying out protected application actions. |
| `gigs.admin_moderation_state` | Retains administrative moderation state separately from the Phase 8 risk decision and supports review queues. |
| `sponsored_gigs` | Holds gig relationship, lifecycle, priority, timing, impression, click, and creation information. Admin-only RLS and administrative RPCs control it. |
| `admin_audit_logs` | Records actor, action, target type/identifier, safe metadata, and timestamp. Normal application users cannot read or mutate these events. |
| Supporting indexes | Indexes support account status, moderation/status/category filters, report state and target type, sponsored state/timing, and audit action/timestamp lookups. |

The SQL RPCs `admin_set_account_status`, `admin_moderate_gig`, `admin_review_report`, `admin_create_sponsored_gig`, `admin_set_sponsored_status`, and `write_admin_audit` all rely on database-side admin checks. Administrative state changes write an audit event with constrained non-secret metadata. The server’s bulk safe-gig approval operation validates the batch schema and routes every item through the same protected RPC; it does not execute a broad client-ID-driven update.

## Security headers and operating safeguards

`server/middleware/securityHeaders.ts` registers the following response defenses without disrupting the MapLibre/OpenFreeMap experience: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. The common protected procedure also denies suspended and blocked sessions before a feature service runs.

The authentication frame now has an explicit mobile single-column viewport boundary, protecting protected-route redirects such as `/admin` from horizontal frame displacement on narrow screens. Automated capture in the anonymous environment still cannot display a real authenticated administrator workspace; its routes correctly redirect to the sign-in flow.

## Advisor review and release follow-ups

The Phase 9 hardening migration revokes authenticated execution from private helper functions. The remaining security-advisor `SECURITY DEFINER` observations correspond to intentional authenticated, ownership-checked application RPCs, including the new admin command functions, employer workflow functions, and trust operations. The `trust_audit_log` table’s RLS-without-user-policy configuration is intentional: it is not exposed as a general user table and operational visibility is supplied through the protected admin audit/security views.

| Follow-up | Owner / rationale |
| --- | --- |
| Enable Supabase Auth leaked-password protection | Project-level Auth setting, not an application migration; required before public launch. |
| Perform authenticated manual acceptance review | Requires a real active `admin` profile and representative marketplace data. Verify desktop/mobile drawer navigation, every status action, and audit rows. |
| Add step-up authentication for irreversible actions | Confirmation dialogs and server-side enforcement are present. Password/second-factor reauthentication remains a Phase 10 production-hardening decision. |
| Add external security telemetry only when a provider is selected | The security overview accurately marks failed-auth and rate-limit event feeds unavailable rather than fabricating signals. |

## Verification

The release verification completed successfully on 21 August 2026:

| Check | Result |
| --- | --- |
| `pnpm check` | Passed with zero TypeScript errors. |
| `pnpm test` | **44 test files and 88 tests passed.** |
| `pnpm build` | Passed; the build retains the existing runtime-resolved managed-image reference and reports a Phase 10 code-splitting opportunity for chunks above 500 kB. |
| Anonymous mobile route smoke check | `/admin`, `/admin/users`, and `/admin/reports` all entered the protected sign-in path at 390 × 844. The mobile auth frame now has an explicit single-column viewport boundary. |
| Supabase Security Advisor | Reviewed after migration hardening. See the findings below. |

Targeted coverage includes unauthenticated/non-admin/suspended-admin rejection, valid admin procedure pass-through, migration authorization boundaries, administrative confirmation-dialog interaction, and security-header assertions.

### Security Advisor findings

The advisor reports one intentional informational notice: `trust_audit_log` has RLS without a general user policy. It is intentionally not exposed to ordinary users; operational access is supplied through the admin-only administrative audit/security interfaces.

It also reports signed-in callable `SECURITY DEFINER` notices for the five new admin RPCs—account status, gig moderation, report review, sponsorship creation, and sponsorship status—plus existing ownership-checked messaging, employer, reporting, rating, and blocking RPCs. These functions remain callable by the authenticated role **intentionally**, because their bodies enforce `public.is_admin()` or `auth.uid()`/ownership checks before making any state change. The Phase 9 grant-hardening migration has revoked access to private helpers that are not public RPC contracts. The relevant advisor guidance is [available in the Supabase database linter documentation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

The only remaining project-level production configuration warning is [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), which must be enabled in Supabase Auth settings before public launch.

## Phase 10 readiness

The next phase can focus on performance profiling and pagination refinement for high-volume installations, retained monitoring/telemetry integration, production Auth settings, step-up controls, authenticated manual acceptance testing, and final security QA. The administrative service namespace, safe typed contracts, RLS model, audit events, and isolated UI shell are already in place for that work.
