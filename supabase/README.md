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

Local function secrets needed:

- `RAWG_API_KEY` (server-side only, never in client apps)

Set it locally:

```sh
supabase secrets set RAWG_API_KEY=your_rawg_key
```

## Contract test

Run with local Supabase running:

```sh
SUPABASE_PUBLISHABLE_KEY=your_publishable_key \
SUPABASE_SECRET_KEY=your_secret_key \
pnpm test:backend-contracts
```

This seeds one temporary row, validates search/detail response shapes, and cleans up.
