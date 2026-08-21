# Phase 9 — Isolated Super Admin Design

## Security boundary

Phase 9 treats `/admin` as a privileged administrative boundary, not as a hidden consumer feature. The existing Express route middleware already redirects unauthenticated `/admin` visitors to login and returns a plain `403` for authenticated non-admin actors. Phase 9 extends this model with an `admin` tRPC procedure that validates the Supabase bearer session, reloads the profile from the database, verifies the role server-side, and rejects the call before a service executes.

| Layer | Enforcement decision |
|---|---|
| Route | `/admin` and every child path require the trusted Supabase actor to have the `admin` role. |
| tRPC | Every `brikouli.admin.*` procedure uses the admin-only wrapper; no consumer procedure becomes privileged. |
| Service | Each service uses the actor-scoped Supabase client, validates bounded inputs, and calls only an ownership/role-checked RPC or RLS-permitted query. |
| Database | Admin-sensitive tables have RLS enabled; policies and security-definer functions test `public.is_admin()` and expose no anonymous execution. |
| UI | The admin shell has no consumer bottom navigation and is never linked from public or employer navigation. It is not relied upon as a security control. |

## Administrative data model

The migration will add an immutable administrative audit ledger and sponsored listing records. Account state belongs on `profiles` and is enforced both by database policies and the service guard. `active`, `suspended`, and `blocked` are distinct account states; user-to-user Phase 8 blocks remain a separate relationship.

| Entity | Purpose and limits |
|---|---|
| `profiles.account_status` | Controls account capability. Only an authenticated admin can set it using a protected command. |
| `sponsored_gigs` | Holds one platform-administered sponsorship record per gig with status, date window, priority, and private performance counters. Payment processing is explicitly out of scope. |
| `admin_audit_logs` | Append-only ledger of sensitive administrator actions. Metadata is constrained to safe identifiers and action context, never credentials, raw sessions, or passwords. |
| `trust_audit_log` | Existing Phase 8 user/trust audit source retained as an input to the admin security summary; it remains private to normal users. |

## Administrative action model

Every command records the acting administrator, target, safe metadata, and timestamp inside the same protected database RPC. List endpoints are paginated and return only data required for a legitimate management task. No endpoint takes a role from the client, accepts an unrestricted update object, or performs a client-ID-only bulk update.

| Action family | Server-validated actions |
|---|---|
| Accounts | suspend, reactivate, or block an account; administrators cannot mutate their own role or status through these commands. |
| Gigs | approve, reject, suspend, remove, request changes, or apply a safe bulk approval only after every candidate is revalidated. |
| Reports | assign/review, resolve, or dismiss a report; report state and resolver are updated together. |
| Sponsorship | create, activate, pause, or expire a sponsored listing without payment collection. |
| Analytics and monitoring | read database aggregates, bounded audit events, repeated-report counts, account state counts, and recent administrative/trust activity. |

## Performance and privacy

User, gig, report, and audit lists use server-side query filters, a maximum page size, and stable pagination. Aggregate analytics excludes private contact fields. Admin detail pages display only the identity, role, account status, public trust summary, activity counts, and report involvement needed for the action; no password, credential, or raw session information is modeled.
