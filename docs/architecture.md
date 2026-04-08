# Architecture Overview

This document reflects the current architecture where Supabase remains the auth
provider and `apps/api` owns application routes.

## Repository shape

Soonr is a Turborepo monorepo with client apps, a Fastify backend for
application routes, shared packages, and Supabase services for auth.

### `apps/api`

Fastify backend for migrated application routes.

Current responsibilities:

- direct Postgres access for migrated routes
- home discovery feed
- search
- title details
- watchlist
- notifications REST endpoints
- notifications websocket stream

### `apps/mobile`

Expo Router app for the phone experience.

Current route groups:

- `(tabs)/home` - entry/home surface
- `(tabs)/search` - guest search and browsing
- `(tabs)/watchlist` - authenticated watchlist
- `(tabs)/notifications` - authenticated notifications feed
- `(tabs)/account` - guest and signed-in account hub
- `(tabs)/account/settings` - settings, theme, and developer tools
- `titles/[titleId]` - shared title details screen from any tab

### `apps/web`

Vite + React app for browser usage.

Current responsibilities:

- guest search
- title details
- auth entry points
- watchlist access where supported

Like mobile, the web app uses the shared `@repo/api-client` to talk to the
Fastify API for application data.

### Shared packages

- `packages/types` - canonical DTOs and shared domain types
- `packages/api-client` - typed client for Fastify application endpoints
- `packages/config` - shared constants and environment wiring

### `supabase`

Database schema, migrations, edge functions, and backend implementation notes.

## Ownership model

Clients own presentation and interaction only.
Supabase still owns:

- auth/session issuance
- realtime auth context

Fastify + direct Postgres now own migrated application behavior for:

- home discovery
- search
- title details
- watchlist
- notifications REST
- notifications websocket fan-out

RAWG is the external metadata source, but clients never call it directly.

Within the mobile app, the current feature ownership pattern is:

- `data-access/` owns request helpers and API-specific shaping
- `queries/` and `mutations/` own React Query wiring, optimistic cache behavior, and invalidation
- `screen-state/` owns discriminated unions plus pure `derive-...` helpers
- `hooks/use-...-screen.ts` owns screen composition only
- screen components render `ready` content and delegate non-ready rendering to feature-specific `...StateView` components

## Direction

- game-only MVP
- direct-DB Fastify backend for migrated routes
- DB-first search with RAWG fallback
- in-app notifications first, push delivery later
