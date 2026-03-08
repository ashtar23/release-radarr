# Supabase Workspace

This folder contains the backend scaffold for Release Radar.

Current structure:

- `config.toml` for local Supabase CLI settings
- `migrations/` for SQL migrations
- `functions/` for edge functions

## Search vertical slice

The first backend slice adds:

- `public.titles` cache table for DB-first game search
- `functions/api` route with `GET /titles?query=...`
- `functions/api` route with `GET /titles/:id`
- RAWG fallback + normalized cache upsert when local results are weak or stale

## Database types for edge functions

Edge functions should import the shared generated schema type from:
- `supabase/functions/_shared/database.types.ts`

Regenerate it from local schema whenever migrations change:

```sh
supabase gen types typescript --local --schema public > supabase/functions/_shared/database.types.ts
```

Local function secrets needed:

- `RAWG_API_KEY` (server-side only, never in client apps)

Set it locally:

```sh
supabase secrets set RAWG_API_KEY=your_rawg_key
```

## Contract test

Run with local Supabase running:

```sh
pnpm test:backend-contracts
```

The test script auto-loads `.env` files from:
- repo root (`.env`, `.env.local`)
- `supabase/.env`
- `apps/web/.env`
- `apps/mobile/.env`

Accepted keys:
- publishable key: `SUPABASE_PUBLISHABLE_KEY` (or app vars `VITE_SUPABASE_PUBLISHABLE_KEY` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- service secret: `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)

If `SUPABASE_URL`/`SUPABASE_LOCAL_URL` is unset, it defaults to `http://127.0.0.1:54321`.

This seeds one temporary row, validates search/detail response shapes, and cleans up.

## Deno editor diagnostics

If you see `Cannot find name 'Deno'.` in `supabase/functions/*`, this is usually an editor configuration issue (Node TS server analyzing Deno files), not a runtime dependency in `package.json`.

This repo uses workspace settings to enable Deno only for `supabase/functions`. In VS Code/Cursor:

- install `denoland.vscode-deno`
- reload the window after installing

If you want to run Deno commands locally (`deno check`, `deno lint`, etc.), install the Deno CLI separately.
