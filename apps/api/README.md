# API Backend

Fastify backend for Release Radar's migrated API routes.

Phase 1 starts with:

- `GET /health`
- `GET /home/discovery`
- `GET /notifications/stream` (websocket)

The hosted API package also includes a manual generation command for the
notifications migration:

- `pnpm --dir apps/api generate:release-approaching`

## Local env

Copy `.env.example` to `.env` and provide:

- `DATABASE_URL` for direct Postgres access

Optional:

- `PORT`
- `HOST`
- `APP_ENV` (`development`, `staging`, `production`, or `test`)

## Local Docker Postgres

Spin up a local database for local API development with:

```bash
docker run --name release-radarr-db \
  -e POSTGRES_USER=release_radar \
  -e POSTGRES_PASSWORD=release_radar \
  -e POSTGRES_DB=release_radar \
  -p 5433:5432 \
  -d postgres:16
```

Then set:

```bash
DATABASE_URL=postgresql://release_radar:release_radar@127.0.0.1:5433/release_radar
```

The API reads directly from Postgres through `DATABASE_URL`.

## Hosted notification generation

Run the hosted `release_approaching` generation job manually with:

```bash
pnpm --dir apps/api generate:release-approaching
```

Optional run date override:

```bash
pnpm --dir apps/api generate:release-approaching --run-date=2026-04-05
```

This command executes the same due-title-window, timing-preset, and deduped
event fan-out behavior currently modeled in the Supabase SQL migration, but it
is owned by the Fastify backend package and runs against `DATABASE_URL`.

## Hosted notifications realtime

When `EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL` points at the Railway API, the
mobile notifications feature can use the hosted websocket endpoint at:

```text
GET /notifications/stream
```

The websocket flow is:

1. client connects to the Railway API websocket route
2. client sends `{ "type": "auth", "accessToken": "..." }`
3. API validates the Supabase-issued token
4. API subscribes the socket to user-scoped notification events
5. Postgres trigger functions emit `pg_notify` messages on inserts or relevant updates to:

- `notification_records`
- `notification_preferences`

The hosted API listens to that `LISTEN/NOTIFY` channel and forwards compact
events to connected clients.

## Local dev

```bash
pnpm --filter api dev
```

## Railway envs

Phase 1 only needs a staging environment.

Set these variables on the API service:

- `DATABASE_URL`
- `APP_ENV=staging`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `PORT` (Railway usually injects this automatically, so only set it if needed)

## API environment matrix

Phase 1 API runtime contract:

| Environment | Required vars                         | Notes                                                 |
| ----------- | ------------------------------------- | ----------------------------------------------------- |
| local       | `DATABASE_URL`, `APP_ENV=development` | local Docker Postgres + local Fastify                 |
| staging     | `DATABASE_URL`, `APP_ENV=staging`     | Railway API + Railway Postgres                        |
| production  | `DATABASE_URL`, `APP_ENV=production`  | same shape as staging when production cutover happens |

Transitional envs that remain available but are not part of the current
`home/discovery` route:

| Var                   | Why it still exists                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `SUPABASE_URL`        | required for migrated authenticated routes that verify Supabase-issued access tokens     |
| `SUPABASE_SECRET_KEY` | same as above                                                                            |
| `RAWG_API_KEY`        | future enrichment/search phases may still use RAWG outside the phase 1 home request path |

## Railway deploy

### Services to create

Create two services in the same Railway project:

- `api-staging`
- `postgres-staging`

### API service settings

1. Create a new Railway service from this repo.
2. Set the root directory to `/` so the workspace packages remain available.
3. Use explicit `pnpm --dir apps/api ...` commands.
4. Set the environment variables above on the API service.
5. Deploy and confirm `GET /health` works before wiring mobile.

Recommended build command:

```bash
pnpm --dir apps/api check-types
```

Recommended start command:

```bash
pnpm --dir apps/api start
```

Recommended health check path:

```text
/health
```

### Database bootstrap

After Railway Postgres is provisioned:

1. copy the Postgres connection string into `DATABASE_URL` on the API service
2. apply the phase-1 home schema SQL

```bash
psql "<railway-postgres-connection-string>" -f apps/api/sql/phase1-home-schema.sql
```

3. apply the phase-1 notifications schema SQL before migrating notification routes

```bash
psql "<railway-postgres-connection-string>" -f apps/api/sql/phase1-notifications-schema.sql
```

That schema file now also installs the notifications realtime trigger functions
and triggers required by the hosted websocket stream.

If you want hosted notification generation to run against real watchlist data,
also apply the watchlists schema bootstrap first:

```bash
psql "<railway-postgres-connection-string>" -f apps/api/sql/phase1-watchlists-schema.sql
```

4. import the exported rows needed for the active migrated routes

For phase 1 home only:

- `titles_rows.sql`

For the phase-1 notifications slice (`GET /notifications`,
`GET /notifications/unread-count`, `POST /notifications/:notificationId/read`,
`POST /notifications/read-all`, and `GET/PUT /notification-preferences`):

- `notification_events_rows.sql`
- `notification_preferences_rows.sql`
- `notification_records_rows.sql`

If you are testing hosted notification generation, make sure the Railway
database also has:

- the `watchlists` table from `apps/api/sql/phase1-watchlists-schema.sql`
- watchlist rows
- title rows with `earliest_release_date`
- notification preference rows when you want non-default opt-in behavior

If your export contains bare `ARRAY[]` values, patch it first:

```bash
perl -0pe 's/ARRAY\\[\\]/ARRAY[]::text[]/g' /path/to/titles_rows.sql > /tmp/titles_rows_patched.sql
```

Then import it:

```bash
psql "<railway-postgres-connection-string>" -f /tmp/titles_rows_patched.sql
```

### Hosted verification

Before wiring mobile:

1. `GET /health`
2. `GET /home/discovery`
3. confirm the API returns real section data from Railway Postgres

## Mobile env

In the mobile app env, set:

- `EXPO_PUBLIC_HOME_API_BASE_URL=https://your-railway-service.up.railway.app`
- `EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL=https://your-railway-service.up.railway.app`

Leave it unset to keep `home/discovery` on the current hosted backend.

Phase 1 mobile env matrix:

| Environment      | Required vars                                                                             | Optional vars                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| local dev build  | `APP_ENV=development`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `EXPO_PUBLIC_HOME_API_BASE_URL=http://127.0.0.1:3001`, `EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL=http://127.0.0.1:3001`                               |
| staging build    | `APP_ENV=staging`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`     | `EXPO_PUBLIC_HOME_API_BASE_URL=https://<api-staging>.up.railway.app`, `EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL=https://<api-staging>.up.railway.app` |
| production build | `APP_ENV=production`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | leave custom API envs unset until production cutover                                                                                                |

## Current phase goal

Point only `home/discovery` at this service first, validate hosted performance,
then migrate additional routes one by one.
