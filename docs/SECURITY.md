# Brikouli Security Model

## Scope

Brikouli connects Job Seekers and Employers for local short-term gigs. It uses a React/Vite client, Express/tRPC server layer, and Supabase Auth/PostgreSQL/RLS. This document records the operational security model through **Phase 9**; it is not a substitute for a production penetration test or legal compliance review.

## Authentication and authorization

Supabase Auth owns identity and browser-session persistence. Browser-visible values only contain the public Supabase URL and publishable key. The server verifies every forwarded access token before protected work and derives the actor from the database-backed profile rather than from a client role claim.

| Actor | Allowed boundary |
| --- | --- |
| Anonymous visitor | Public content and Auth entry only. Protected services reject missing/invalid sessions. |
| Job Seeker / Employer | Their own RLS-scoped marketplace, application, profile, messaging, trust, and employer resources according to ownership checks. |
| Super Admin | Separate `/admin` routes and privileged, server/database-enforced administrative procedures only when the authoritative profile has `role = 'admin'` and `account_status = 'active'`. |

Normal users cannot modify their own role. Suspended and blocked accounts are rejected in the shared protected-procedure boundary and by active-account database enforcement.

## Row Level Security and data minimization

Supabase RLS is enabled for marketplace, messaging, trust, sponsored, and administrative data. Browser clients use the authenticated user context, not a service-role credential. Server services use the caller’s verified access token so RLS remains part of the authorization decision.

Administrative list queries select only fields required for operations and paginate on the server. Administrative user surfaces intentionally exclude passwords, session material, authentication secrets, and other unnecessary credentials. Aggregate analytics avoid exposing unnecessary personally identifiable data.

## Admin isolation and auditability

The admin system is protected at interface, session, tRPC, service, SQL/RPC, and RLS layers. Its layout has no public navigation link and does not reuse the consumer mobile navigation. Each sensitive administrative mutation is confirmed through an accessible application dialog and captured in `admin_audit_logs` with safe metadata; normal application users cannot read or mutate those records.

Administrative SQL RPCs check `public.is_admin()` themselves. `SECURITY DEFINER` is used only where SQL needs controlled privileged capability and is paired with role/ownership validation. Private helper functions have explicit execution grants revoked from anonymous and authenticated users where they are not intended as public RPCs.

## Browser and transport defenses

The Express middleware sends `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. CSP is maintained to permit the existing Supabase and map integrations. The user interface provides visible keyboard focus states, screen-reader labels, and confirmation dialogs for high-impact actions.

## Secrets and deployments

Do not commit `.env` files, service-role credentials, JWT signing secrets, or Supabase Auth material. Configure runtime secrets through the project’s secure settings. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are intentionally browser-visible. Apply Supabase migrations in chronological order in each target environment and validate all RLS behavior using non-admin test identities before publishing.

## Threat-model assumptions and follow-ups

The model assumes Supabase Auth, HTTPS, the managed environment, and the configured project secrets remain trustworthy. It mitigates direct URL guessing, client-side role manipulation, ordinary IDOR attempts, mass-assignment input, unauthorized privileged calls, and raw credential leakage from the application bundle.

Before public launch, enable Supabase’s leaked-password protection, create a controlled active admin identity, perform authenticated mobile/desktop administrative acceptance testing, and decide on a step-up authentication design for irreversible moderation or account actions. External failed-auth, rate-limit, and intrusion telemetry should be integrated only after selecting an authoritative provider; the current admin security view makes unavailable feeds explicit rather than reporting fabricated events.
