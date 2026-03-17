# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Turborepo monorepo with shared TypeScript packages, dual clients, and a Supabase-first backend cache/API layer

**Key Characteristics:**
- Web and mobile clients are presentation-focused and consume shared contracts
- Backend search/detail requests follow DB-first lookup with RAWG fallback and cache fill
- Shared packages centralize API wiring, environment config, and domain types
- Current MVP is intentionally narrow: game discovery, auth foundations, and title details

## Layers

**Client UI Layer:**
- Purpose: Route composition, screens/pages, local interaction state, and rendering
- Contains: Expo Router screens in `apps/mobile/src/app/**` and TanStack Router pages/routes in `apps/web/src/**`
- Depends on: Feature hooks, shared API client, shared UI/types/config packages
- Used by: End users on native and web

**Feature/Data Access Layer:**
- Purpose: Encapsulate fetch logic, query hooks, and auth session wiring per app
- Contains: Search/title query hooks, auth providers, `lib/api-client.ts`, `lib/supabase.ts`
- Depends on: `@repo/api-client`, `@repo/types`, `@supabase/supabase-js`
- Used by: Route components and feature UIs

**Shared Workspace Layer:**
- Purpose: Keep API contracts, env naming, and reusable UI primitives consistent across apps
- Contains: `packages/types`, `packages/config`, `packages/api-client`, `packages/ui`
- Depends on: TypeScript, Supabase client, and web-only UI dependencies in `@repo/ui`
- Used by: Both apps and backend-adjacent code

**Backend API Layer:**
- Purpose: Route requests, validate inputs implicitly, fetch cached rows, and hydrate from RAWG when needed
- Contains: `supabase/functions/api/index.ts`, route handlers, repository helpers, mappers, provider adapters
- Depends on: Supabase admin client, Deno fetch, environment variables, RAWG
- Used by: Web/mobile clients through `/functions/v1/api`

**Persistence Layer:**
- Purpose: Store cached game metadata and support local search/detail responses
- Contains: `public.titles` table and SQL indexes in `supabase/migrations/`
- Depends on: Supabase Postgres and RLS configuration
- Used by: Supabase Edge Function repository helpers and contract tests

## Data Flow

**Search Request:**

1. User types into the web search panel or mobile `Stack.SearchBar`.
2. App hook debounces input and calls `apiClient.searchTitles(...)`.
3. Shared API client sends `GET /functions/v1/api/titles?query=...` with Supabase auth headers.
4. Supabase Edge Function resolves the route in `supabase/functions/api/routing.ts`.
5. `handleSearchRequest` queries cached `titles` rows first.
6. If results are too few or stale, the function fetches RAWG results and upserts them into Postgres.
7. JSON results are returned to the app and cached by React Query.

**Title Detail Request:**

1. User opens `/titles/[titleId]` on mobile or `/titles/$titleId` on web.
2. App query hook calls `apiClient.getTitleDetails(...)`.
3. Edge Function looks up the title row by id.
4. If cached detail data is fresh, it maps the row directly to the response.
5. If stale and a RAWG id/key are available, the function fetches fresh details, upserts, and returns the normalized payload.

**Auth Session Flow:**

1. Each app initializes a Supabase client through `initializeSupabaseClient`.
2. App-level auth provider calls `supabase.auth.getSession()` on mount.
3. `onAuthStateChange` updates in-memory session state.
4. API client fetches access tokens from the current session and forwards them as bearer tokens.

**State Management:**
- Remote state: React Query in both apps
- Auth state: local React context around Supabase session subscriptions
- Persistent backend state: Supabase Postgres `titles` cache only so far
- Local UI state: component state, router params, and some mobile sheet/modal state

## Key Abstractions

**ReleaseRadarApiClient:**
- Purpose: Shared typed facade for backend health/search/detail calls
- Examples: `createReleaseRadarApiClient`, `searchTitles`, `getTitleDetails`
- Pattern: Factory returning a small method surface

**Supabase Client Initializer:**
- Purpose: Centralize env validation and optional client creation
- Examples: `packages/api-client/src/supabase-client.ts`
- Pattern: Safe initializer returning `{ client, isConfigured, configError }`

**Repository + Mapper Pairing:**
- Purpose: Separate DB reads/writes from payload normalization in the Edge Function
- Examples: `titles-repository.ts`, `mapping/titles.ts`
- Pattern: Thin repository functions feeding pure-ish mapping helpers

**Route-based Feature Modules:**
- Purpose: Keep feature-specific UI and queries grouped beneath routes
- Examples: `apps/web/src/features/search`, `apps/mobile/src/features/search`
- Pattern: Feature folders with components, queries/hooks, and utilities

## Entry Points

**Mobile App Shell:**
- Location: [`apps/mobile/src/app/_layout.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/app/_layout.tsx)
- Triggers: Expo Router app startup
- Responsibilities: Create QueryClient, wrap auth/theme/sheet providers, register stack routes

**Web App Bootstrap:**
- Location: [`apps/web/src/main.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/web/src/main.tsx)
- Triggers: Browser loading the Vite bundle
- Responsibilities: Mount React tree, QueryClientProvider, AuthProvider, and RouterProvider

**Supabase API Function:**
- Location: [`supabase/functions/api/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/index.ts)
- Triggers: HTTP requests to `/functions/v1/api/*`
- Responsibilities: CORS handling, route dispatch, admin client creation, top-level error handling

## Error Handling

**Strategy:** Throw or return plain `Error` messages close to the boundary; convert them to user-facing strings in route components

**Patterns:**
- Shared client throws on non-OK HTTP responses and invalid payloads
- App query hooks/components translate unknown errors to generic copy
- Edge function wraps the entire request in `try/catch` and returns JSON error payloads
- Repository helpers throw on Supabase query errors rather than returning result objects

## Cross-Cutting Concerns

**Logging:**
- Minimal right now; mostly implicit via thrown errors and command/test stdout
- No structured runtime logging or observability layer yet

**Validation:**
- Auth form input uses `zod` via shared `authCredentialsSchema`
- API client validates top-level response shape manually
- Edge Function request validation is light and mostly based on route/query guard clauses

**Authentication:**
- Supabase Auth is the single auth system across web and mobile
- User session tokens are forwarded to the backend API, but the current function config disables JWT verification for the local function

---
*Architecture analysis: 2026-03-17*
*Update when major patterns change*
