# Deploying Brikouli on Vercel

## Deployment model

Brikouli is **not** a static Vite-only site. The repository now contains a root `server.ts` that exports the existing Express application for Vercel’s Node.js runtime, alongside the Vite client output. This preserves the tRPC API, email/password action routes, OAuth callback route, session-cookie endpoints, headers and route-protection middleware. Vercel treats an exported Express application as a Function, while Vite produces optimized public assets. [1] [2]

| Vercel Import field | Use this value |
| --- | --- |
| Repository | `amimerayoub/brikouli` |
| Branch | `main` |
| Project name | `brikouli` |
| Framework Preset | `Vite` |
| Root Directory | `./` |
| Install Command | Leave the repository configuration in control, or use `pnpm install --frozen-lockfile` |
| Build Command | Leave the repository configuration in control, or use `pnpm run vercel-build` |
| Output Directory | Leave the repository configuration in control, or use `dist/public` |

The committed `vercel.json` owns these build settings. Do not replace the preset with a static-only rewrite to `index.html`; that would bypass the Express page-protection middleware on server-routed protected paths.

## Required Vercel environment variables

Add values in **Project Settings → Environment Variables** for both Production and Preview. Never prefix server secrets with `VITE_`; Vite includes `VITE_*` values in the browser build.

| Variable | Visibility | Why it is needed |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Public build value | Browser and server Supabase project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public build value | Browser Supabase publishable/anon key. |
| `JWT_SECRET` | Server secret | Existing session/OAuth helper signing. |
| `NODE_ENV` | Server setting | Set to `production`. |
| `BRIKOULI_AI_ENABLED` | Server setting | Keep `false` unless server-side model use is deliberately enabled. |
| `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL` | Optional Manus OAuth only | Required only if the existing Manus OAuth path must stay enabled on the Vercel domain. |
| `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY` | Manus-only server integration | Existing private media proxy and optional Forge features use them. Replace the storage/AI provider before relying on those features outside Manus. |

> **Do not add Supabase service-role credentials to Vercel or the client.** Brikouli uses the publishable key, server-verified access tokens, RLS, and ownership/admin checks as its privilege boundary.

## Before the first deployment

The primary email/password and phone flows already use Supabase and can run with the public Supabase values above. The shared unauthenticated fallback now routes safely to `/login` if Manus OAuth variables are absent. If Manus OAuth remains enabled, add the Vercel production and preview callback URL—`https://<deployment-domain>/api/oauth/callback`—to the OAuth provider’s permitted redirects.

Private message media currently uses Manus Forge storage. Vercel can host the route, but cannot manufacture Manus-managed credentials or storage access. Either keep valid authorized server-side Forge access where permitted, or migrate that media adapter to a Vercel-compatible object-storage provider before declaring media uploads portable. The optional AI feature remains disabled by default and must not receive a browser key.

## First deployment and verification

1. In the Vercel import form shown, keep **Vite** and root directory `./`, then continue to the environment-variable step.
2. Add the required variables, beginning with the two Supabase public build values. Add server-only variables without the `VITE_` prefix.
3. Click **Deploy** only after reviewing the environment list. Use the generated Preview deployment first.
4. Verify `/`, `/explore`, `/api/trpc`, `/login`, `/register`, a protected page redirect, and an email/password sign-in on the Preview URL.
5. Verify the production URL, update Supabase Auth Site URL and redirect URLs for that domain, and retest password reset and email confirmation.

Vercel Functions scale server work on demand and are request-scoped; do not use in-memory state for authorization, notifications or conversations. Brikouli already persists these concerns in Supabase. [1]

## Known portability prerequisites

| Capability | Status on Vercel before extra work |
| --- | --- |
| Vite client, tRPC, Supabase RLS and email/password auth | Configured for Preview testing once Vercel variables are added. |
| Manus OAuth | Optional; requires corresponding Manus settings and Vercel callback allow-listing. |
| Private managed media | Requires compatible storage credentials/provider; not automatically portable. |
| Forge AI | Disabled by default; must remain server-only if intentionally enabled. |
| Supabase SMTP registration issue | Unchanged: configure valid SMTP and enable leaked-password protection before public email/password launch. |

## References

[1] [Vercel: Express on Vercel](https://vercel.com/docs/frameworks/backend/express)

[2] [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
