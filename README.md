# Soonr Monorepo

Soonr is a Turborepo monorepo for tracking game releases across mobile and web clients, backed by Supabase.

The current architecture is split by responsibility:

- Supabase Auth remains the session/auth provider
- `apps/api` owns migrated application routes and talks directly to Postgres
- web and mobile send application data requests to `apps/api`

## Workspace map

- `apps/api` — Fastify API for migrated backend routes
- `apps/mobile` — Expo SDK 55 app (Expo Router)
- `apps/web` — Vite + React web app
- `packages/types` — shared domain and API contract types
- `packages/api-client` — shared typed API client scaffolding
- `packages/config` — shared app/backend constants
- `packages/eslint-config` — shared ESLint configs
- `packages/typescript-config` — shared TypeScript configs
- `packages/ui` — starter UI package from scaffold (not part of MVP core architecture)
- `supabase` — backend scaffold (`config.toml`, `migrations`, `functions`)
- `docs` — product and architecture documents

## Product boundaries (MVP)

In scope:

- guest search
- auth (email/password)
- title details
- watchlist add/remove
- notification preferences
- in-app notifications
- push shortly after notification records

Out of scope:

- movies/TV support
- store pricing or preorder tracking
- admin dashboards
- passkeys

## Development

From repo root:

```sh
pnpm install
pnpm dev
```

Useful scripts:

```sh
pnpm dev:web
pnpm dev:mobile
pnpm lint
pnpm check-types
```

## Supabase client auth setup

Client apps use Supabase Auth with email and password.

Required environment variables:

```sh
# apps/web/.env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=

# apps/mobile/.env
APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

Use only the Supabase project URL and publishable key in client apps.
Do not use service role or any other secret key in web or mobile.

Guest search remains available without auth.
Auth is required for watchlist and notification features.

## Mobile environments

The mobile app now uses explicit build/runtime environments:

- `development`
- `staging`
- `production`

`APP_ENV` controls the app identity, while `EXPO_PUBLIC_SUPABASE_*` values control which Supabase backend the build talks to.

Default hosted mapping:

- development app -> staging backend
- staging app -> staging backend
- production app -> production backend

See [docs/mobile-environments.md](docs/mobile-environments.md) for the full environment, EAS, and release workflow contract.

## Local Supabase Verification

From repo root:

```sh
supabase start
supabase status
```

`supabase status` should show:
- Project URL (`http://127.0.0.1:54321` by default)
- MCP endpoint (`http://127.0.0.1:54321/mcp`)
- Publishable key

Optional auth sanity check:

```sh
curl -si http://127.0.0.1:54321/auth/v1/settings -H "apikey: <YOUR_PUBLISHABLE_KEY>"
```

You should receive `HTTP/1.1 200 OK`. Use only the publishable key for client-side checks and app config.

## Local API Verification

The migrated Fastify backend lives in `apps/api`.

From repo root:

```sh
pnpm dev:api
```

Then verify:

```sh
curl -s http://127.0.0.1:3001/health
```
