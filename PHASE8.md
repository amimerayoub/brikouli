# Phase 8 — Trust, Ratings, Reviews, Reporting, and Safety

## Outcome

Phase 8 adds Brikouli’s **security-by-design trust and safety foundation** without building an Admin Dashboard. The implementation remains on the actual React 19, Vite, Express, tRPC, Supabase, and MapLibre project stack, adapting the supplied Next.js-specific language rather than changing framework.

> **Trust rule:** ratings are not ordinary client-created records. A participant can submit exactly one rating only after a database-validated, completed gig with the accepted other participant.

| Capability | Delivered behavior |
|---|---|
| Two-way ratings | A completed gig can receive one rating from each legitimate participant, from one to five stars and with an optional, bounded comment. |
| Reviews and profile trust | The profile now renders the true average, count, distribution, recent reviews, and only evidence-backed badges. No “verified” badge is emitted because Phase 8 has no account-verification workflow. |
| Legitimate completion | An employer can confirm only an assigned, owned gig with an accepted application. The protected RPC writes the completion, increases the two participants’ completed-job counts, and creates an audit record. |
| Reports | Users can privately report profiles, gigs, permitted applications, ratings, conversations, or messages. Open duplicate reports for the same reporter and target are rejected. |
| Blocking | Blocking and unblocking use a protected RPC. Database policies prevent new messages and new applications between either direction of a blocked employer/job-seeker pair. |
| Moderation | Arabic-normalized title, description, and category checks produce `safe`, `review`, or `blocked`. The employer wizard consumes an authenticated, Arabic-safe preview that reveals no internal rules; review-risk publication remains a draft and blocked publication fails. |
| Audit readiness | Sensitive completion, rating, report, block, and moderation events write to a private `trust_audit_log`, reserved for the Phase 9 administrative surface. |

## Data and enforcement model

The migration `20260821210000_trust_safety.sql` adds trust audit records, report-resolution metadata, moderation state on gigs, aggregate-supporting indexes, and protected RPCs. The small follow-up migration `20260821211000_moderation_high_voltage_normalization.sql` closes an Arabic inflection gap so expressions such as `جهد عال` and `جهد عالي` both receive the high-voltage blocked result.

| Boundary | Database/server enforcement |
|---|---|
| Rating manipulation | `submit_completion_rating` verifies gig completion, accepted-pair participation, direction, self-rating prohibition, and existing submission before insert. A unique `(gig_id, from_user)` index remains a race-safe duplicate boundary. |
| Unauthorized completion | `complete_owned_gig` checks employer ownership, current `assigned` status, and an accepted application before setting `completed`. A transition trigger rejects arbitrary status jumps. |
| Report abuse and visibility | `create_private_report` verifies target availability for the reporter; a partial unique index blocks open/reviewing duplicates. Reports are readable only to their reporter under RLS. |
| Cross-surface blocks | The existing conversation message policy and the new application policy each deny interactions when either party has blocked the other. |
| Client-side mass assignment | Direct authenticated insert/update/delete permissions on ratings, reports, and blocks are revoked. The browser reaches only explicitly granted, identity-checked RPCs. |
| Private audit data | `trust_audit_log` has RLS enabled and intentionally no normal-user policy, so no public or authenticated client can read audit records. |

The reusable server preview shares the same Arabic normalization and risk levels as the database. It returns only a safe localized outcome to the user rather than internal matched-rule names. The database remains authoritative for write and publish decisions.

## User experience

The `/ratings` screen lists only real, completed-gig counterparties. Its rating sheet is keyboard-accessible and uses five clearly labelled radio controls, optional comment input, a skip action, and a touch-friendly submit action. The employer Gig Management screen shows an **إكمال المهمة** confirmation only for assigned work and submits it through the protected completion RPC.

The `/safety` screen presents the account owner’s block list and their own private reports, with a confirmation before unblock. Conversations now use a reusable **حظر المستخدم** bottom sheet that clearly explains the effect before it calls the protected block mutation. Job Details offers a reusable Arabic report bottom sheet alongside a contextual safety notice. These are not admin interfaces and do not expose report queues, audit records, reviewer decisioning, or private contact data.

## Security-advisor review

The Phase 8 Supabase security review was run after migrations. It confirms the intentional RLS-without-policy state on the private audit log and lists the expected signed-in callable security-definer RPCs. Those functions are intentionally executable only by authenticated users because each performs identity, ownership, participation, or target checks internally; public and anonymous execution is revoked. The review also retains the pre-existing project-level recommendation to enable leaked-password protection in the Supabase Auth security settings. [1] [2]

## Verification

| Verification | Result |
|---|---|
| Migrations | Both Phase 8 migrations applied successfully to `erwtygmftpgdtyabawsg`; `trust_audit_log`, ratings, reports, and blocks were verified. |
| TypeScript | `pnpm check` passed with zero errors. |
| Automated tests | `pnpm test` passed: **40 files and 80 tests**. Focused coverage includes rating eligibility errors, duplicate reports, self-block prevention, employer completion denial, authenticated moderation preview, Arabic safe/review/blocked moderation, migration/RLS contracts, and accessible rating/report/block interactions. |
| Production build | `pnpm build` passed. Existing non-blocking static-storage URL resolution and MapLibre chunk-size notices remain. |
| Visual review | Desktop protected ratings and safety entry states were reviewed. Authenticated paired-account records are not available in the preview environment, so live rating, block, report, and completion acceptance flows require real test accounts for a final product acceptance run. |

## Key files

The primary server service is `server/services/trustSafety.ts`; its tRPC contracts live in `server/routers.ts` and `server/schemas/domain.ts`. The trust UI is provided by `TrustProfilePanel`, `RatingSheet`, `ReportSheet`, and `SafetyNotice`, with the new `Ratings` and `SafetySettings` pages. The Phase 8 database source is in the two migrations listed above.

## References

[1]: https://supabase.com/docs/guides/database/database-linter?lint=0008 "Supabase Database Linter: RLS enabled without policy"
[2]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase Auth password-security guidance"
