# Brikouli | بريكولي

Brikouli is an Arabic-first, mobile-first platform foundation for connecting young people with nearby local business owners who need short-term help. **Phase 2** adds Supabase-backed authentication, PostgreSQL schema migrations, Row Level Security, storage policy preparation, validated service boundaries, and Arabic RTL account flows. Maps, chat, employer-dashboard UI, and admin-dashboard UI remain explicitly out of scope.

## Phase 2 scope

| Capability | Implementation |
| --- | --- |
| Email and password | Premium Arabic RTL login, registration, password-reset, and session-persistence flows backed by Supabase Auth |
| Phone OTP | Phone-code request and verification UI, ready for a configured Supabase SMS provider |
| Legal consent | Mandatory Arabic disclaimer modal; acceptance is sent as Auth metadata and saved into the auto-created `profiles` record |
| PostgreSQL | Applied Supabase migrations for profiles, gigs, applications, ratings, reports, enums, indexes, and timestamps |
| RLS | Policies protect every marketplace table; authenticated roles are checked both in SQL policies and in server-side helpers |
| Storage | Private `avatars`, `voice-notes`, and `gig-images` buckets with ownership and gig-relationship policies |
| Services | Typed Supabase services, Zod validation, standard `{ success, data }` / `{ success, code, message }` responses, and a tRPC boundary |
| Protected routes | `/dashboard`, `/profile`, `/messages`, `/employer`, and `/admin` redirect unauthenticated users to login and intentionally expose no future dashboard UI |

## Architecture

This managed project runs a React, Vite, Express, and tRPC stack. Supabase is the Phase 2 product identity and marketplace-data provider. The public browser client owns session persistence, while server-side services validate every forwarded bearer token with Supabase before role-sensitive operations. The UI never executes SQL.

```text
brikouli/
├── client/src/
│   ├── pages/auth/             # Arabic RTL login, registration, reset, OTP, and guards
│   ├── lib/supabase/           # Browser Auth client
│   ├── lib/api/                # Browser authentication calls
│   └── hooks/                  # Session-aware protected-route hook
├── server/
│   ├── actions/                # Validated server action contracts
│   ├── schemas/                # Zod schemas and validation tests
│   ├── services/               # Server-only Supabase service layer and role helpers
│   ├── supabase/trpc.ts        # Verified Supabase tRPC procedure
│   └── *.test.ts               # Connection, RLS, validation, and cookie tests
├── shared/brikouli.types.ts    # Domain and typed API-result contracts
├── supabase/
│   ├── migrations/             # Applied schema, RLS, Storage, and remediation migrations
│   └── seed.development.json   # Moroccan Arabic development fixture; not auto-imported
└── README.md
```

## Supabase configuration

The application expects the following managed environment variables. Configure them through the project secret interface; **never expose or commit a service-role key**.

| Variable | Use |
| --- | --- |
| `VITE_SUPABASE_URL` | Public Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable key used by the browser Auth client under RLS |

The Phase 2 migrations have been applied to the connected Supabase project. They are retained in `supabase/migrations/` as the source of truth. For another environment, apply the files in chronological order with Supabase migration tooling before enabling the UI.

## Authentication flow

Registration validates the name, email, password, role, and mandatory consent locally and again in server contracts. Supabase Auth creates the identity, and the `auth.users` trigger creates the corresponding profile with the accepted-terms timestamp. Email/password sessions persist through the Supabase browser client. The server does not trust browser profile data: protected tRPC procedures forward the access token and validate it with Supabase before using the RLS-protected profile.

Phone OTP is implemented in the interface and uses Supabase Auth’s phone APIs. Before enabling it publicly, configure an SMS provider and accepted phone regions in the Supabase Dashboard. Configure the final deployment URL as an allowed redirect URL for email recovery and confirmation.

## Security notes

All marketplace tables use RLS. Safe public-profile fields are replicated into a dedicated RLS-protected `public_profiles` projection, rather than exposing private profile fields. Internal policy helpers are held in the non-exposed `private` schema; they are not callable through the public RPC surface. Storage buckets are private by default and are scoped to the current user or gig owner.

Supabase’s last security check reports only that **leaked-password protection is disabled**. Enable this feature in Supabase Auth settings before a public launch, as it is a dashboard-level account setting rather than an application migration.

## Local development and verification

```bash
pnpm install
pnpm dev
```

Run the full verification sequence before a release:

```bash
pnpm check
pnpm test
pnpm build
```

The test suite covers the configured Supabase Auth endpoint, anonymous RLS denial for gig creation, safe-profile and active-gig reads, authentication validation, consent validation, OTP payload validation, and the template session-cookie logout behavior.

## Seed fixture

`supabase/seed.development.json` supplies realistic Moroccan Arabic records for a job seeker, an employer, an admin, and three Marrakech-based gig concepts. It is intentionally **not auto-seeded**, because real Auth users must exist first and fixture data must never be inserted into production without review.

## Deployment

Create a project checkpoint, configure the two public Supabase variables in the project settings, verify the Supabase Auth redirect URLs, then publish through the Manus interface. This managed repository is build-verified for its React/Vite/Express runtime. A direct Next.js 15/Vercel repository would require a separate runtime conversion; the Supabase SQL migrations and service contracts can be carried forward without re-designing the data model.

## Phase 3 readiness

Phase 3 can add real gig discovery, profile management UI, applications, and storage uploads against the existing authenticated/RLS-protected service boundaries. Maps, chat, employer dashboards, and admin dashboards should remain deferred until their product and moderation requirements are specified.
