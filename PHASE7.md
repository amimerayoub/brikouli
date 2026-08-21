# Phase 7 — Secure Real-Time Messaging

## Outcome

Phase 7 replaces Brikouli’s placeholder messages surface with a secure, Arabic-first messaging system for accepted employer–job-seeker pairs. It remains within the project’s established React 19, Vite, Express, tRPC, and Supabase architecture; the Phase 7 request’s Next.js and Server Actions references were intentionally adapted rather than introduced.

> **Connection rule:** a conversation is never client-created. A database trigger creates the one allowed conversation only when an application moves from `pending` to `accepted`, then adds the two participants and two system messages in the same transaction.

| Capability | Delivered implementation |
|---|---|
| Conversation gate | `conversations.application_id` is unique and refers to an accepted application; no public insert policy permits conversation creation. |
| Participant protection | Conversation, member, and message RLS policies restrict reads to the two stored participant IDs. User-authored messages require active status and `sender_id = auth.uid()`. |
| Conversation management | Each participant can archive or hide a conversation locally, mark it read, close it for both participants, block the other participant, or submit a prepared moderation report. |
| Text, image, and voice | The RTL composer supports long Arabic text, copy, image preview, camera/gallery image selection, browser voice capture, pause/resume/cancel, preview, and a 30-second voice limit. |
| Private media | Voice and image bytes use the project’s managed private S3 storage helper. Only an object key is stored, and an authorized service returns a signed retrieval URL. |
| Read state | Read receipt state is derived from server-updated message timestamps through `mark_conversation_read`, rather than trusted from client-provided booleans. |
| Realtime | The inbox refreshes from Supabase Postgres Changes. A private conversation channel subscribes to message/status changes and uses Presence for the Arabic `يكتب الآن…` indicator. |
| Responsive UX | `/messages` is a mobile-first inbox. `/messages/:conversationId` becomes a two-column inbox/chat layout at desktop widths while retaining the focused mobile chat experience. |

## Data and policy model

The migration `20260821200000_secure_messaging.sql` adds `conversations`, `conversation_members`, `messages`, and `user_blocks`. It also extends report target types to include conversations and messages, indexes list/history paths, adds the `supabase_realtime` publication entries, and contains explicit policies for private Broadcast and Presence topics in the form `conversation:<conversation-id>`.

| Table | Security-relevant responsibility |
|---|---|
| `conversations` | Immutable accepted-application linkage plus employer and job-seeker IDs; closed state is set only through a protected RPC. |
| `conversation_members` | Per-participant read, archive, and hide state with self-only update policy. |
| `messages` | Text, media metadata, receipts, and system notices; constraints prevent user-authored system messages or incompatible text/media combinations. |
| `user_blocks` | Per-user block relationships that prevent new user-authored messages for either direction of the pair. |

Supabase documents that Realtime Postgres Changes respects the subscriber’s RLS read access. [1] Private Broadcast and Presence channels are separately authorized through policies on `realtime.messages`, with the client using `private: true`. [2] Phase 7 provides those policies.

> **Deployment prerequisite:** before production use of typing Presence, disable **Allow public access** in the connected Supabase project’s Realtime settings. Supabase requires this setting for private-channel authorization policies to be enforced. [2]

## Validation and verification

The application server validates every conversation action again before accessing a private object, sending a message, closing a conversation, or creating a moderation report. Media validation allows only JPEG, PNG, WebP, AVIF, WebM, Ogg, MP3, and WAV; it applies an 8 MB maximum, MIME/data-URL consistency checks, signature checks, and a declared 30-second audio maximum. The browser captures and limits voice recording accordingly.

| Verification | Result |
|---|---|
| Supabase migration | Applied successfully to `erwtygmftpgdtyabawsg`; the four Phase 7 tables were verified to exist. |
| TypeScript | `pnpm check` passed with zero errors. |
| Tests | `pnpm test` passed: **37 files and 71 tests**. |
| Production build | `pnpm build` passed. The established static-storage resolution notice and MapLibre-sized chunk advisory remain non-blocking. |
| Focused Phase 7 coverage | Covers non-participant-role denial, closed-conversation read-only enforcement, invalid media rejection before storage, composer controls and typing state, acceptance trigger contract, RLS/Realtime migration boundaries, and protected endpoint contracts. |

The preview environment does not currently contain an Employer profile or accepted application pair, so authenticated two-party visual acceptance and a live Realtime event exchange cannot be captured there without real test accounts. The protected entry experience was reviewed; the server, schema, DOM, and build verification above are complete. A real employer/job-seeker pair should be used once available to confirm the final production Realtime settings prerequisite and end-to-end live exchange.

## Key implementation files

The primary server surface is `server/services/messaging.ts`, exposed through `brikouli.messaging.*` in `server/routers.ts`. Browser Realtime behavior is isolated in `client/src/hooks/useMessagingRealtime.ts`. The responsive inbox and chat routes live in `client/src/pages/Messages.tsx` and `client/src/pages/Conversation.tsx`, with the reusable composer in `client/src/components/messaging/ChatComposer.tsx`.

## References

[1]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase Postgres Changes"
[2]: https://supabase.com/docs/guides/realtime/authorization "Supabase Realtime Authorization"
