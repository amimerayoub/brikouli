# Brikouli | بريكولي

**Brikouli** is an Arabic-first, mobile-first web foundation for connecting young people with nearby local business owners who need short-term help. This Phase 1 release focuses on a polished public experience, a scalable frontend vocabulary, and safe integration boundaries. It does not include authentication, maps, messaging, employer tooling, administration, or live marketplace data.

## Product principles

The public experience is designed in RTL from the outset, with a mobile-native bottom navigation, accessible touch targets, a persistent light/dark preference, and a calm editorial visual system. Brikouli is a technical intermediary only; the Phase 1 interface makes no claims about employing users or processing transactions.

| Area | Phase 1 implementation |
| --- | --- |
| Interface | Arabic RTL landing experience with reusable navigation, cards, badges, and actions |
| Theming | Persisted light/dark UI preference through the installed theme provider |
| Design system | Brikouli green `#16A34A`, 18px structural radius, soft depth, and premium glass surfaces |
| Data boundaries | Placeholder service functions under `client/src/lib/api/`; no UI component communicates with SQL |
| Supabase | Client/server configuration placeholders only; no authentication or database initialization |
| Maps | Environment-variable preparation only; no rendered maps |

## Security preparation

The current static public frontend does not process credentials or access a database. Future request middleware can adopt the security header and CSP directive contract in `client/src/lib/security/headers.ts`. Administrative routes are deliberately absent. This separation keeps user-facing views from holding privileged integration concerns.

## Repository structure

```text
brikouli/
├── client/
│   ├── src/
│   │   ├── components/      # Branding, cards, layout, navigation, and shared primitives
│   │   ├── contexts/        # Theme preference provider
│   │   ├── lib/api/         # Future service contracts
│   │   ├── lib/supabase/    # Integration configuration placeholders
│   │   ├── pages/           # Public route composition
│   │   └── types/           # Shared domain vocabulary
│   └── index.html           # Arabic language and RTL document declaration
├── .env.example             # Future public configuration keys
├── ideas.md                 # Chosen visual direction and design decisions
└── README.md
```

## Technology stack

The managed project scaffold provides React 19, TypeScript, Tailwind CSS 4, Lucide icons, Wouter routing, and `next-themes`. The requested Supabase and Mapbox values are documented as future public configuration, without exposing any secret or creating a direct client-to-database path.

## Local development

Install the project dependencies and start the development service from the repository root.

```bash
pnpm install
pnpm dev
```

For production checking, run the type check and build scripts.

```bash
pnpm check
pnpm build
```

## Environment variables

Copy `.env.example` to your private environment file before enabling external services. Publicly named configuration fields never substitute for secret server credentials.

| Variable | Planned use |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Future Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Future public Supabase client key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Future map-rendering token |

## Deployment

This project is configured as a static managed frontend experience. A production deployment should run the supplied `pnpm build` command and serve the generated static application. Before going live, ensure the production environment has only intended public configuration and that any future private integration credentials remain server-side.

## Future roadmap

The next stages can add secure account management, Supabase clients and row-level security, service-backed gig discovery, Mapbox-based locality discovery, applications, messaging, employer management, content moderation, and admin workflows. These capabilities are intentionally absent from Phase 1 so the public foundation remains focused and safe to extend.
