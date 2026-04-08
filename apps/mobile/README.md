# Mobile App

This is the Expo SDK 55 mobile client for Soonr.

## Supabase auth setup

The mobile app uses Supabase Auth with email and password.

Required environment variables:

```bash
APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_BASE_URL=
```

Use only:

- the Supabase project URL
- the Supabase publishable key

Do not use:

- service role keys
- secret keys
- any server-only credential

`EXPO_PUBLIC_API_BASE_URL` routes the mobile app's application data surfaces to
the Railway API while Supabase continues to handle auth.

## Environment model

The mobile app supports three runtime environments:

- `development`
- `staging`
- `production`

`APP_ENV` selects the app identity:

- `development` -> `Soonr Dev`
- `staging` -> `Soonr Staging`
- `production` -> `Soonr`

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
