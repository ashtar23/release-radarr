# Mobile App

This is the Expo SDK 55 mobile client for Release Radar.

## Supabase auth setup

The mobile app uses Supabase Auth with email and password.

Required environment variables:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
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
- mobile session persistence uses AsyncStorage

## Run

```bash
pnpm --filter mobile start
```
