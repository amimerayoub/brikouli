# Brikouli — Phase 10 Security Audit

## Review conclusion

The Phase 10 review confirmed that the product retains its principal authorization boundaries: verified sessions and account state on the server, Supabase RLS on data, and ownership/admin validation within SQL functions that perform multi-row or privileged work. The implementation does **not** add browser service-role access, direct client SQL, a parallel backend, or an AI key in frontend code.

| Area | Status | Evidence and treatment |
| --- | --- | --- |
| Session and account enforcement | Implemented | Protected tRPC procedures validate a server-known session and active account state before invoking services. |
| Administrative isolation | Implemented | Administrative procedures require a verified active `admin` role, with the SQL/RLS layer retaining the final check. |
| Notifications | Implemented | `notifications` uses owner/admin select policy, owner-only read-state updates and trigger-authored inserts. |
| Search telemetry | Implemented | `search_events` permits self-insert and administrator-only read; the dashboard displays aggregates only. |
| AI credentials | Implemented | The optional AI gateway resides in `server/lib/ai`; browser code has no model credential or raw prompt access. |
| Error exposure | Hardened | The root client error boundary no longer renders a stack trace to end users. |
| Security headers and private storage | Preserved | Existing Phase 7–9 CSP/HSTS and managed private-media controls remain in place. |

## Supabase advisor review — 22 August 2026

The Supabase security advisor was re-run after the Phase 10 migration. Its remaining findings fall into two categories.

| Finding | Classification | Decision |
| --- | --- | --- |
| `trust_audit_log` has RLS with no general policy | Intentional | The table is deliberately not generally readable or writable. Trusted, ownership-checked functions and administrator processes control it. A broad policy would weaken the audit trail. |
| `SECURITY DEFINER` functions executable by `authenticated` | Intentional but monitored | Functions such as account-state checks, owned conversation actions, application review, reporting, ratings, employer lifecycle actions and administrative commands verify ownership or active administrator status internally. Their authenticated execution is required for RLS-safe workflows. Do not revoke grants blindly. |
| Leaked password protection disabled | Owner action required | Enable it in **Supabase Auth → Password Security** before public launch. This setting cannot be safely substituted in application code. |

The advisor warnings are not ignored: they are reviewed as part of each SQL change. Functions should be made `SECURITY INVOKER` or moved out of exposed schemas only after a replacement authorization path is tested. Any new `SECURITY DEFINER` function must set a safe `search_path`, validate the actor, use narrow grants, and receive a dedicated migration test.

## Data and privacy controls

| Data category | Control |
| --- | --- |
| Profiles and preferences | Owner-scoped profile updates with validated settings inputs. |
| Gigs, saves and applications | RLS-backed discovery and ownership-checked application/lifecycle functions. |
| Conversations and media | Accepted-pair membership, private storage, signed retrieval and Realtime scoped to owned conversations. |
| Notifications | Trigger-authored records, owner read state and Realtime publication with RLS. |
| Search telemetry | Short normalized query/context events, no dashboard identity fields, administrator-only aggregate access. |
| Trust reports and audit records | Private duplicate-safe reports and deliberately closed audit-log access. |

## Required launch actions

> **The live registration path is not launch-ready until Supabase email delivery is repaired.** The configured SMTP account returned Gmail error `535 5.7.8 Username and Password not accepted` while trying to send confirmation mail.

The project owner must configure a valid transactional SMTP provider or valid Gmail SMTP credentials with an App Password, confirm sender/redirect settings, and complete a real confirmation-mail test. The owner must also enable leaked-password protection. These are control-plane settings and must not be bypassed by auto-confirming users or fabricating accounts.

## Ongoing review cadence

Re-run the Supabase security advisor after every database migration, inspect production runtime logs following deployment, and review administrator audit records. Investigate any unexpected privilege change, repeated failed-auth pattern, unsafe moderation trend or unrecognized Realtime subscription. Rotate external credentials through the managed secret store rather than source control.
