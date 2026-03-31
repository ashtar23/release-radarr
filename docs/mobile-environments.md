# Mobile Environments

Release Radar mobile now uses three explicit environments:

- `development`
- `staging`
- `production`

The mobile app is configured through `apps/mobile/app.config.ts` and selected with `APP_ENV`.

## App identities

Each hosted environment has its own installable app identity so staging and production can coexist on the same device.

| APP_ENV | App name | Scheme | iOS bundle identifier | Android package |
| --- | --- | --- | --- | --- |
| `development` | `Release Radar Dev` | `releaseradar-dev` | `com.ashtar23.releaseradar.dev` | `com.ashtar23.releaseradar.dev` |
| `staging` | `Release Radar Staging` | `releaseradar-staging` | `com.ashtar23.releaseradar.staging` | `com.ashtar23.releaseradar.staging` |
| `production` | `Release Radar` | `releaseradar` | `com.ashtar23.releaseradar` | `com.ashtar23.releaseradar` |

## Backend targets

Hosted environment routing:

- `development` -> staging Supabase project
- `staging` -> staging Supabase project
- `production` -> production Supabase project

Local Supabase remains available for backend development and contract testing, but the mobile app does not automatically switch to it. If a local mobile build is needed later, use explicit env overrides rather than changing the default environment model.

## Required mobile env vars

The mobile app currently needs:

```sh
APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Runtime behavior:

- `APP_ENV` selects the app identity and build target
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` select the backend the app talks to

Only publishable client credentials belong in the mobile app. Do not put service role or secret keys in Expo env vars.

## EAS profiles

`apps/mobile/eas.json` defines:

- `development`
- `staging`
- `production`

Profile intent:

- `development`: dev client / internal build against staging backend
- `staging`: installable internal build against staging backend
- `production`: release build against production backend

`production` uses remote app version management and auto-increments developer-facing build numbers during EAS builds.

The EAS environment mapping is explicit:

- `development` profile -> `development`
- `staging` profile -> `preview`
- `production` profile -> `production`

Remote builds read `EXPO_PUBLIC_*` values from EAS environment variables, not from GitHub Actions job env alone.
GitHub secrets handle workflow authentication and deploy credentials; EAS environment variables handle the app config bundled into the remote build.

## Supabase separation

Operational model:

- local Supabase for development and contract tests
- staging Supabase project for hosted testing
- production Supabase project for real users/releases

Recommended GitHub secrets for workflows:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_STAGING_PROJECT_REF`
- `SUPABASE_PRODUCTION_PROJECT_REF`
- `SUPABASE_STAGING_DB_PASSWORD`
- `SUPABASE_PRODUCTION_DB_PASSWORD`
- `SUPABASE_STAGING_URL`
- `SUPABASE_STAGING_PUBLISHABLE_KEY`
- `SUPABASE_PRODUCTION_URL`
- `SUPABASE_PRODUCTION_PUBLISHABLE_KEY`
- `EXPO_TOKEN`

## Branching and release policy

- `main` is the production-ready branch
- use feature branches for work
- no long-lived `dev` branch for now

Release model:

- CI runs on pushes and pull requests
- production release is manually triggered from GitHub
- production release workflow updates the mobile app version, deploys Supabase changes, and starts the production mobile build

## Manual release flow

1. Merge production-ready work to `main`
2. Trigger the production release workflow with the next semantic app version
3. Workflow updates `apps/mobile/package.json`
4. Workflow deploys production migrations and the `api` function to Supabase
5. Workflow starts the EAS production build
6. Workflow commits the version bump back to `main`
