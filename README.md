# Release Radar Monorepo

Release Radar is a Turborepo monorepo for tracking game releases across mobile and web clients, backed by Supabase.

## Workspace map

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
