# Brikouli Launch Runbook

## Launch position

Phase 10 completes the code-level production foundation for Arabic RTL discovery, secured workflows, persisted notifications, settings, server-only AI preparation, monitored error recovery, public discovery metadata and aggregate administrator analytics. The service should not be described as publicly ready until the two required Supabase Auth configuration tasks below are complete.

| Readiness area | Current position | Owner action |
| --- | --- | --- |
| Web application build | Ready for release verification | Use the managed checkpoint created after final validation. |
| RLS, policies and migration | Applied to production Supabase project | Re-run advisor after later SQL migrations. |
| AI foundation | Safe default: disabled | Set `BRIKOULI_AI_ENABLED=true` only after intentionally accepting server-side model usage and monitoring costs/quality. |
| Notification delivery | Durable in-app + Realtime-ready | Validate with a real accepted application, message and rating pair after launch setup. |
| Email/password registration | Blocked by SMTP credential failure | Configure valid SMTP and send/confirm a real test email. |
| Password protection | Not yet enabled | Enable Supabase leaked-password protection. |

## Pre-launch checklist

1. In Supabase Auth, replace the invalid SMTP configuration. The observed Gmail error was `535 5.7.8 Username and Password not accepted`; use a valid App Password or a transactional provider, verify the sender, and test the real confirmation-email journey.
2. Enable leaked-password protection in Supabase Auth password security settings.
3. Confirm production Auth redirect URLs, Site URL and email templates use the production domain.
4. Confirm the `notifications` table remains included in the `supabase_realtime` publication after any database restore or migration.
5. Verify environment secrets are configured only in managed server settings. Do not add `.env` files or service-role keys to the repository.
6. If optional AI is enabled, keep the switch server-only, begin with deterministic fallback monitoring, and review advisory output before relying on it operationally.
7. Save a managed recovery checkpoint and retain the associated GitHub commit if a source push is requested.

## Post-launch smoke journeys

Use actual consenting test accounts. Do not insert synthetic customer records or bypass confirmation email.

| Journey | Expected result |
| --- | --- |
| Register and confirm email | A confirmation email arrives, the user confirms, and login reaches the correct Arabic role flow. |
| Job Seeker search | Public discovery works without login; authenticated smart search and recommendations return only permitted active gigs. |
| Apply and employer review | Duplicate application is prevented; employer can accept/reject only an owned gig; durable notification appears for the affected party. |
| Messaging | An accepted pair can exchange permitted content, unread/read state updates, and private media remains private. |
| Settings | Skills, availability, language, notification preference and visibility save only for the signed-in account. |
| Admin analytics | An active administrator sees aggregate metrics and search demand, while non-admin routes remain forbidden. |
| Error recovery | A forced client rendering error shows the localized retry state without a stack trace. |

## Monitoring and incident response

The current monitoring foundation emits structured server events and minimized client-error events to managed runtime logs. Review local development logs in `.manus-logs/` during development and production logs through the managed runtime after a deployment. Do not record passwords, access tokens, message content, file URLs, raw prompts or user identifiers in application logs.

For an incident, first preserve logs and identify the affected authorization scope. For source regression, restore the latest managed checkpoint. For data incidents, use Supabase backup/restore procedures into a non-production environment before any production recovery. Re-run the security advisor after a restoration or SQL repair.

## Publishing and source control

Saving a successful managed checkpoint publishes the current project because auto-publish is enabled. Phase 10 source changes are not pushed to GitHub automatically; push only when the project owner requests it. The confirmed repository is `amimerayoub/brikouli` on the `main` branch.
