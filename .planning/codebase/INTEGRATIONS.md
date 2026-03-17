# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**External Metadata API:**
- RAWG - Game metadata search and detail fallback for backend cache fill
  - Integration method: Deno `fetch` in [`supabase/functions/api/providers/rawg.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/providers/rawg.ts)
  - Auth: `RAWG_API_KEY` environment variable
  - Endpoints used: search (`games` base URL with `search`/`page_size`) and per-game detail (`games/{id}`)

**Local/Hosted Backend API Surface:**
- Supabase Edge Functions - `/functions/v1/api/titles` and `/functions/v1/api/titles/:id`
  - Client: shared `ReleaseRadarApiClient`
  - Auth: Supabase publishable key plus optional user access token
  - Consumers: `apps/mobile` and `apps/web`

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary persisted data store so far
  - Connection: Supabase admin client inside the Edge Function
  - Client: `@supabase/supabase-js`
  - Migrations: SQL files in `supabase/migrations/`

**Caching:**
- Database-backed cache in `public.titles`
  - Purpose: Store normalized RAWG search/detail data and freshness timestamps
  - Freshness logic: `search_updated_at` / `detail_updated_at` evaluated in backend utilities

**File Storage:**
- None implemented yet in committed code

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password sessions for both clients
  - Implementation: `initializeSupabaseClient` from `@repo/api-client`
  - Token storage:
    - Web: Supabase JS default browser storage behavior
    - Mobile: AsyncStorage configured in [`apps/mobile/src/lib/supabase.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/lib/supabase.ts)
  - Session management: `getSession()` on mount plus `onAuthStateChange`

**OAuth Integrations:**
- None implemented yet

## Monitoring & Observability

**Error Tracking:**
- None configured

**Analytics:**
- None configured

**Logs:**
- Supabase function logs / local command output only
- No dedicated structured log sink in the repo

## CI/CD & Deployment

**Hosting:**
- Supabase hosts the backend services
- Expo is the intended native delivery path for mobile
- Web is a Vite-built frontend; deployment target is not encoded in the repo yet

**CI Pipeline:**
- No committed GitHub Actions or other CI workflow files were found in the scanned tree

## Environment Configuration

**Development:**
- Required client env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Required backend env vars:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - optional `RAWG_API_KEY`
- Local services are defined in [`supabase/config.toml`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/config.toml)

**Staging / Production:**
- Not fully documented in repo yet
- Expect separate Supabase projects/credentials per environment

## Webhooks & Callbacks

**Incoming:**
- None implemented yet

**Outgoing:**
- RAWG is called directly from the backend as needed; no webhook or async callback flow exists yet

## Integration Notes

- Clients are intentionally prevented from calling RAWG directly; all external metadata access goes through Supabase functions
- The mobile and web apps share the same API path prefix from `@repo/config`, which reduces drift risk when backend endpoints evolve
- Backend contract tests assume access to both publishable and service-role Supabase credentials

---
*Integration audit: 2026-03-17*
*Update when adding/removing external services*
