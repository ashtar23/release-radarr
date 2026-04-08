# Backend Migration Plan

This document records the current backend migration decision, the evidence that
led to it, and the phased rollout plan so work can resume cleanly even if local
context is lost.

## Status

Decision status: locked for phase 1

Target direction:

- own backend
- own database
- keep Supabase Auth for now
- keep Supabase Realtime for now
- no Kubernetes

## Why We Are Moving

Soonr currently routes app traffic through hosted Supabase backend
surfaces:

- Supabase Edge Functions
- Supabase REST / Data API style access paths

That path was repeatedly slow on cold start, especially for the home screen.

## What We Tested

### 1. Existing Supabase home feed

Result:

- cold-start home requests were often multi-second
- startup fan-out made the problem worse

### 2. Simpler home feed on Supabase

We removed:

- RAWG fallback on request path
- richer ranking logic
- extra complexity in `home/discovery`

Result:

- still slow
- this ruled out the home feed design as the only bottleneck

### 3. Railway API using `supabase-js`

We moved `home/discovery` behind a Fastify service on Railway, but the API was
still talking to Supabase over HTTP through `supabase-js`.

Result:

- not meaningfully better
- this ruled out "just put a Node server in front" as the full solution

### 4. Local Fastify + direct local Postgres

We ran:

- our own Fastify API
- direct Postgres access
- locally imported `titles` data

Result:

- home feed became effectively instant

## Conclusion

The meaningful win came from:

- our own API
- direct Postgres access

It did **not** come from:

- hosting a custom API that still talks to Supabase over HTTP
- simplifying the home feed alone

So the architecture change we want is not just "move off Edge Functions". It is:

- own the API
- own the DB access path

## Locked Architecture for Phase 1

### Keep

- Supabase Auth
- Supabase Realtime

### Migrate

- app API routes to our own Fastify backend
- application data to our own Postgres database

### Hosting target

Preferred phase 1 host:

- Railway `api` service
- Railway Postgres service

Why Railway:

- good developer experience
- private networking between services
- fast path to validate hosted performance using the 30-day paid trial window

### Explicitly not in phase 1

- Kubernetes
- self-hosting on a Fedora PC
- moving Supabase Auth
- moving Realtime
- migrating every endpoint at once

## Architecture Shape

### Phase 1 runtime shape

- mobile app -> Fastify API for migrated routes
- web app -> Fastify API for migrated routes
- Fastify API -> Railway Postgres over private networking
- mobile/web -> Supabase Auth for sign-in/session
- mobile/web -> Supabase Realtime for realtime subscriptions

### Boundary rule

For migrated routes, business logic should live in our backend, not in clients and
not in Supabase Edge Functions.

## Phase 1 Environment Contract

### API

| Environment | Required vars | Transitional vars |
| --- | --- | --- |
| local | `DATABASE_URL`, `APP_ENV=development` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RAWG_API_KEY` |
| staging | `DATABASE_URL`, `APP_ENV=staging` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RAWG_API_KEY` |
| production | `DATABASE_URL`, `APP_ENV=production` | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RAWG_API_KEY` |

Phase 1 expectation:

- migrated routes use `DATABASE_URL`
- transitional Supabase/RAWG envs are not part of the `home/discovery` hot path
- valid `APP_ENV` values are `development`, `staging`, `production`, and `test`
- migrated authenticated routes still verify Supabase-issued access tokens with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`

### Mobile

| Environment | Required vars | Optional vars |
| --- | --- | --- |
| development | `APP_ENV=development`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `EXPO_PUBLIC_HOME_API_BASE_URL` |
| staging | `APP_ENV=staging`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `EXPO_PUBLIC_HOME_API_BASE_URL` |
| production | `APP_ENV=production`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `EXPO_PUBLIC_HOME_API_BASE_URL` only after production cutover |

Current phase 1 routing rule:

- default app backend remains Supabase
- only `home/discovery` is allowed to override to the custom API through env
- the phase-1 notifications override may also route `GET /notifications`, `GET /notifications/unread-count`, and `GET/PUT /notification-preferences` to the custom API once deployed

## Key Decisions

### 1. Why not Kubernetes?

Because it adds operational complexity without solving the problem we just
proved. One API service and one managed database do not justify the overhead.

### 2. Why not move Auth now?

Supabase Auth is not the proven bottleneck. Keeping it reduces migration risk
and lets phase 1 focus on the part that actually affects performance.

### 3. Why not move Realtime now?

Realtime is not the proven bottleneck either. It can be moved later if needed,
but phase 1 should keep it stable.

### 4. Why not add OpenAPI / Swagger first?

The API shape is still settling. The current monorepo already has:

- `packages/types`
- `packages/api-client`

Those are enough for phase 1. Contract generation can be revisited after the
first set of migrated endpoints is stable.

## Migration Principles

- prefer the smallest end-to-end slice
- keep one source of truth per endpoint
- avoid hybrid request logic in the client
- do not reintroduce RAWG fallback on request paths unless there is a proven
  need
- measure before broadening scope

## Phase Plan

## Phase 1A: Stabilize Local API

Goal:

- turn the current local spike into a clean, intentional backend slice

Scope:

- clean `apps/api`
- clean local env handling
- make direct Postgres the intended path
- remove temporary debug logging
- keep `home/discovery` as the first real migrated endpoint

Tasks:

- remove debug logs from:
  - `packages/api-client/src/home.ts`
  - `apps/mobile/src/features/home/hooks/use-home-screen.ts`
- make `apps/api` direct-DB-first
- keep Supabase fallback only if clearly useful
- clean `apps/api/.env.example`
- clean `apps/api/README.md`
- make the mobile home override the official mechanism again

Acceptance criteria:

- local API starts cleanly
- local mobile can point only home to the local API through env
- no debugging noise remains in normal app logs

## Phase 1B: Shared API Surface Cleanup

Goal:

- make the API consumption path clean and reusable for both mobile and web

Scope:

- stabilize `packages/api-client`
- define shared error handling
- define backend URL override strategy

Tasks:

- standardize request helper behavior
- standardize API error shape and client-side error handling
- ensure mobile and web can both consume the new backend through the shared
  client

Acceptance criteria:

- one shared request/client layer
- no duplicated endpoint-specific fetch logic in apps

## Phase 1C: Production-Shape `home/discovery`

Goal:

- ship one backend endpoint that is fast, simple, and production-safe

Scope:

- `GET /home/discovery`

Rules:

- direct Postgres access
- no RAWG fallback on request path
- keep the response contract compatible with current app usage

Acceptance criteria:

- home works locally through our backend
- payload shape remains compatible with the apps
- performance remains close to the local proof

## Phase 1D: Railway Staging Deployment

Goal:

- host the first migrated backend slice

Services:

- `api-staging`
- `postgres-staging`

Bootstrap assets:

- `apps/api/sql/phase1-home-schema.sql`

Initial data required:

- `titles`

Tasks:

- deploy Fastify to Railway
- provision Railway Postgres
- connect API to DB over private networking
- apply the titles bootstrap SQL
- import `titles`
- point staging/dev mobile home to Railway API

Acceptance criteria:

- `/health` works on Railway
- `/home/discovery` returns real data
- staging/dev mobile app can load home from Railway

## Phase 1E: Measure Hosted Reality

Goal:

- verify that the hosted version still keeps the win we saw locally

Metrics:

- cold-start home latency
- repeat latency
- perceived app startup
- endpoint logs in Railway

Decision gate:

- if home remains fast, continue migration
- if home regresses badly, inspect deployment and DB placement before migrating
  more routes

## Phase 2: Migrate the Next Endpoints

After `home/discovery` is stable, migrate:

- `watchlist`
- `notifications`
- `notification-preferences`
- `notifications/unread-count`

Rules:

- migrate one surface at a time
- keep Supabase as fallback only while the route is not yet migrated
- do not mix route ownership long-term

## Phase 3: Search and Details

Only after the first app surfaces are stable:

- search
- title details
- any background enrichment flows

This phase may require revisiting:

- search ranking implementation
- background ingestion strategy
- whether RAWG fallback belongs on request paths or in jobs

## Phase 4: Realtime Reassessment

Only revisit this after the API and DB migration are stable.

Questions for that phase:

- is Supabase Realtime still sufficient?
- do we need our own websocket / SSE service?
- do we want to self-host Supabase Realtime?

## Data Migration Strategy

Phase 1 should not move the entire current Supabase database at once.

For `home/discovery`, only `titles` is required.

Recommended strategy:

1. create minimal schema needed for the migrated endpoint
2. import only the required data
3. expand table coverage as more endpoints migrate

This keeps the migration readable and lowers rollback risk.

## Rollout Strategy

### Local

- local API
- local Postgres
- mobile points home to local API with env override

### Hosted staging

- Railway API + Railway Postgres
- mobile staging/dev points home to Railway API
- rest of the app remains on Supabase until migrated

### Production

Do not move production traffic until:

- phase 1 staging is stable
- home performance is confirmed
- rollback path is documented

## Rollback Strategy

For each migrated route, the client must be able to switch back through config,
not invasive code rewrites.

For phase 1 home:

- keep client routing behind env/config
- if Railway staging fails, point home back to Supabase

## Immediate Next Step

Start with **Phase 1A**:

- stabilize the local API
- remove spike/debug leftovers
- make the home route clean
- keep the architecture direct-DB-first

After phase 1A is complete, move to shared client cleanup and then Railway
staging.
