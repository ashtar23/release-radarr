# Web App

This is the Vite + React web client for Soonr.

## Supabase auth setup

The web app uses Supabase Auth with email and password.

Required environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

Use only:

- the Supabase project URL
- the Supabase publishable key

Do not use:

- service role keys
- secret keys
- any server-only credential

## Behavior

- guest search and browsing remain available
- auth is required for watchlist and notifications
- auth UI is wired to Supabase session bootstrap, sign in, sign up, and sign out
- `VITE_API_BASE_URL` routes all application surfaces to the Fastify API while Supabase continues to handle auth
- if `VITE_API_BASE_URL` points to a deployed Railway API during local development, that API must allow `http://localhost:5173` in `CORS_ALLOWED_ORIGINS`

## Run

```bash
pnpm --filter web dev
```
