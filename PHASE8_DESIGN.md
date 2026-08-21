# Phase 8 — Trust & Safety Design

## Architecture decision

Phase 8 extends Brikouli’s existing **React/Vite, Express, tRPC, and Supabase** implementation rather than introducing the specification’s Next.js-only conventions. The browser submits only validated intent; the Supabase database and server services decide identity, participation, ownership, rating eligibility, report visibility, blocks, moderation, and valid lifecycle transitions.

| Capability | Authoritative enforcement |
|---|---|
| Rating | A security-definer RPC confirms the caller and target are the accepted employer/job-seeker pair on a completed gig, rejects self-rating and a second rating, inserts the rating, updates the recipient aggregate, and records an audit event. |
| Completion | An employer-owned RPC permits only `assigned → completed`, requires an accepted application, increments both participants’ completed-job totals once, and writes an audit event. |
| Reports | A server service verifies that the target exists and is relevant to the reporter where privacy requires it. The database permits only self-created reports, prevents concurrent duplicate reports for a target, and keeps reports unavailable to normal users. |
| Blocks | The established `user_blocks` table remains the single source of truth. Database policies prevent messages and new applications between either direction of a blocked pair. |
| Moderation | Normalized Arabic title, description, and category text are assessed into `safe`, `review`, or `blocked`. The database trigger records the result; `review` material remains a draft and `blocked` material cannot be published. |
| Audit | A private, normal-user-inaccessible `trust_audit_log` stores security-sensitive completion, rating, report, block, and moderation events for Phase 9 administration. |

## Privacy and truthfulness

Public trust presentation uses only an average, count, distribution, recent permitted review text, and truthfully computed badges. A “verified” badge is not created because there is no verified-account evidence in the schema. Exact private locations, phone numbers, voice files, reports, message contents, audit records, and reviewer identity beyond the existing allowed profile display are never added to public profile data.

| Trust indicator | Genuine condition |
|---|---|
| Completed gigs | `completed_jobs > 0` on the profile. |
| Strong ratings | At least three received ratings and a calculated average of at least 4.5. |
| Established member | Account creation timestamp is at least 90 days old. |
| Verified account | Not emitted in Phase 8 because no verification workflow exists. |

## Moderation levels

The server normalizes Arabic alef variants, taa marbuta, whitespace, punctuation, and letter case before matching structured rules across all three gig fields. Rules are never returned in detail to normal users; the client receives only the localized outcome appropriate to its action.

| Level | Publishing behavior | User-facing result |
|---|---|
| `safe` | May remain or become active when other lifecycle checks pass. | No warning. |
| `review` | Forced to draft/unpublished pending future review. | A concise Arabic message that publishing needs review. |
| `blocked` | Publishing is rejected. | A concise Arabic safety warning without exposing internal matching logic. |

## Abuse-prevention foundation

Phase 8 does not add third-party anti-spam services or background jobs. It provides deterministic server-side validation points: report duplicate constraints, 1–5 star constraints, completion/rating participation checks, unique direction-per-gig rating checks, message/application block predicates, limited text lengths, and audit records. These controls are deliberately reusable by a future administrative moderation layer.
