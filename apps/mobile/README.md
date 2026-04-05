# Mobile App

This is the Expo SDK 55 mobile client for Release Radar.

## Supabase auth setup

The mobile app uses Supabase Auth with email and password.

Required environment variables:

```bash
APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_HOME_API_BASE_URL=
EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL=
EXPO_PUBLIC_WATCHLIST_API_BASE_URL=
```

Use only:

- the Supabase project URL
- the Supabase publishable key

Do not use:

- service role keys
- secret keys
- any server-only credential

`EXPO_PUBLIC_HOME_API_BASE_URL`, `EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL`, and
`EXPO_PUBLIC_WATCHLIST_API_BASE_URL` are optional migration overrides. When
set, the mobile app routes only those migrated slices to the custom API and
keeps all other requests on Supabase Functions.

## Environment model

The mobile app supports three runtime environments:

- `development`
- `staging`
- `production`

`APP_ENV` selects the app identity:

- `development` -> `Release Radar Dev`
- `staging` -> `Release Radar Staging`
- `production` -> `Release Radar`

Hosted backend mapping:

- development app -> staging backend
- staging app -> staging backend
- production app -> production backend

EAS build profiles live in [eas.json](eas.json).
The full contract is documented in [docs/mobile-environments.md](../../docs/mobile-environments.md).

## Behavior

- guest search and browsing remain available
- auth is required for watchlist and notifications
- auth UI is wired to Supabase session bootstrap, sign in, sign up, and sign out
- mobile session persistence uses AsyncStorage

## Run

```bash
pnpm --filter mobile start
```
