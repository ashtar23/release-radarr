# Architecture Overview

## Repository shape

Soonr is a Turborepo monorepo with two apps, shared packages, and a Supabase backend.

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

### Shared packages

- `packages/types` - canonical DTOs and shared domain types
- `packages/api-client` - typed client for Supabase edge endpoints
- `packages/config` - shared constants and environment wiring

### `supabase`

Database schema, migrations, edge functions, and backend implementation notes.

## Ownership model

Clients own presentation and interaction only.
Supabase owns:

- cached title data
- release/platform metadata
- watchlists
- notification records and preferences
- search refresh and ranking behavior

RAWG is the external metadata source, but clients never call it directly.

Within the mobile app, the current feature ownership pattern is:

- `data-access/` owns request helpers and API-specific shaping
- `queries/` and `mutations/` own React Query wiring, optimistic cache behavior, and invalidation
- `screen-state/` owns discriminated unions plus pure `derive-...` helpers
- `hooks/use-...-screen.ts` owns screen composition only
- screen components render `ready` content and delegate non-ready rendering to feature-specific `...StateView` components

## Direction

- game-only MVP
- Supabase-first backend
- DB-first search with RAWG fallback
- edge API as the only client-facing backend surface
- in-app notifications first, push delivery later
