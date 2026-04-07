# Web App

This is the Vite + React web client for Soonr.

## Supabase auth setup

The web app uses Supabase Auth with email and password.

Required environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
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

## Run

```bash
pnpm --filter web dev
```
