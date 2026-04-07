# Deploying Supabase

This note is the small operational guide for deploying Supabase changes in Soonr.

## Two separate targets

There are two different pieces of Supabase configuration in this repo:

### 1. App runtime target
This is what the mobile or web app talks to at runtime.

Examples:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

These values control:
- auth
- edge function requests
- realtime
- REST access from the client

They do **not** control where the Supabase CLI deploys.

### 2. Supabase CLI deploy target
This is what `supabase functions deploy` and `supabase db push` talk to.

The CLI target is determined by:
- `supabase link --project-ref ...`
- the linked project state stored locally by the Supabase CLI

This can drift from the app runtime target if the project was linked earlier for a different environment.

## Why explicit link matters

If the app points to staging but the CLI is still linked to prod or another project, it is possible to:
- deploy a function successfully
- insert data into staging successfully
- still see `404 Not found` in the app

That usually means the app and the CLI are pointing at different Supabase projects.

## Repo scripts

Use the root scripts instead of raw CLI commands when deploying:

```sh
pnpm supabase:staging:functions
pnpm supabase:staging:db
pnpm supabase:staging:all

pnpm supabase:prod:functions
pnpm supabase:prod:db
pnpm supabase:prod:all
```

These scripts always:
1. link explicitly to the target project
2. then run the requested deploy action

That makes deploys reproducible and avoids relying on previous CLI state.

## Required env vars

### Staging
```sh
export SUPABASE_STAGING_PROJECT_REF=your-staging-project-ref
export SUPABASE_STAGING_DB_PASSWORD=your-staging-db-password
```

### Production
```sh
export SUPABASE_PROD_PROJECT_REF=your-production-project-ref
export SUPABASE_PROD_DB_PASSWORD=your-production-db-password
```

## Which script to use

### Function-only change
Use when only edge function code changed.

```sh
pnpm supabase:staging:functions
```

Examples:
- new API route
- handler changes
- backend logic changes

### Schema-only change
Use when only migrations changed.

```sh
pnpm supabase:staging:db
```

Examples:
- new migration
- new index
- new table/column

### Full backend rollout
Use when both migrations and edge functions changed.

```sh
pnpm supabase:staging:all
```

## Recommended workflow

### Staging
1. deploy to staging first
2. verify hosted API behavior
3. verify app behavior against staging
4. then promote the same change to prod

### Production
Only deploy to prod after staging has been verified.

## Quick rule of thumb

- app `.env` values decide where the client talks
- Supabase deploy scripts decide where backend changes go

Keep those two concepts separate and explicit.
