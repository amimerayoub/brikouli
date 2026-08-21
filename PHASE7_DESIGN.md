# Phase 7 Design — Secure Real-Time Messaging

## Architecture decision

Brikouli Phase 7 remains on the existing React 19, Vite, Express, tRPC, and Supabase architecture. It does not introduce Next.js server actions. The server exposes typed tRPC procedures while Supabase Row Level Security remains the database enforcement layer.

> **Messaging gate:** a conversation is created only by a database trigger when an application moves from `pending` to `accepted`. The trigger also inserts the two participant membership records and system messages in the same database transaction. Neither client nor application server can create a conversation directly.

| Concern | Design decision |
|---|---|
| Conversation identity | One immutable conversation per accepted application, enforced by a unique `application_id`. It stores the gig, employer, and job seeker IDs for efficient participant checks. |
| Conversation state | `active`, `archived`, and `closed` are modelled. A membership record additionally holds per-user archive, hide, and read state so one participant’s local action does not remove the other participant’s history. |
| Messages | Text, voice, image, and system records have a sender, content, private media key/mime metadata, delivery timestamp, and recipient read timestamp. Read status is derived rather than trusted from a client boolean. |
| Private media | The project’s managed private S3 storage helper is the single source of truth. The database stores only an object key; a server service authorizes the conversation participant before returning a short-lived signed URL. |
| Realtime messages | The browser subscribes to `messages` and conversation/member updates through Supabase Realtime. Database RLS limits Postgres Changes events to rows the participant can select. |
| Typing status | A private Supabase Presence channel named `conversation:<id>` carries a small `{ userId, typing }` payload. RLS policies on `realtime.messages` authorize only the two accepted-application participants. |
| Moderation preparation | Conversation hide/archive state, user block records, and report target types for conversations/messages are present without an Admin UI. |

## Security and realtime constraints

Conversation and message RLS policies require that the authenticated user is the employer or job seeker stored on the conversation. The insert policy additionally requires an active conversation and makes `sender_id = auth.uid()`. A database check blocks user-authored `system` messages. Closed conversations are read-only, and the server performs the same checks before every media upload or signed URL response.

For typing presence and lightweight broadcasts, the browser joins a **private** channel. Supabase authorizes private Broadcast and Presence using RLS policies on `realtime.messages`; Postgres Changes also checks a subscriber’s RLS read access before sending table events. [1] [2] The project’s Realtime settings must have public channel access disabled for those private-channel policies to be enforced. [1]

## Media policy

Voice recording uses the browser’s `MediaRecorder` API and stops automatically at 30 seconds. The client offers pause, resume, cancel, preview, and send states. Images may originate from the camera or gallery, are compressed in-browser when possible, and are accepted only as JPEG, PNG, WebP, or AVIF. The server validates MIME, encoded payload size, conversation membership, closed status, and voice duration declaration before writing private bytes through the project storage helper.

| Medium | Allowed MIME values | Maximum | Stored database fields |
|---|---|---|---|
| Image | `image/jpeg`, `image/png`, `image/webp`, `image/avif` | 8 MB after client compression | object key, MIME, size |
| Voice | `audio/webm`, `audio/ogg`, `audio/mpeg`, `audio/wav` | 8 MB and 30 seconds | object key, MIME, size, duration |

## Responsive UX

On mobile, `/messages` presents a searchable conversation list and `/messages/:conversationId` presents a full-screen RTL chat with a sticky header and bottom-safe composer. At wider viewports, the page becomes a two-column inbox with the list kept visible beside the active conversation. Long text, media preview, read receipts, local hide/archive actions, keyboard navigation, focus states, reduced motion, and accessible labels are first-class states.

## References

[1]: https://supabase.com/docs/guides/realtime/authorization "Supabase Realtime Authorization"
[2]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase Postgres Changes"
