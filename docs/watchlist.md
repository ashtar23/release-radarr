# Watchlist Integration

This is the current-state reference for how the watchlist works today.

## What the watchlist is

- title-level saved list for authenticated users
- backed by Supabase and exposed through the edge API
- driven by `@repo/api-client`, not direct fetch calls from screens

## Backend flow

1. client requests `GET /watchlist`
2. backend returns the current user’s saved titles plus platform releases
3. `POST /watchlist` validates the title exists and creates or updates the saved item
4. `DELETE /watchlist/:titleId` removes the saved item for the current user

The backend keeps the watchlist unique per user/title pair and enforces access through Supabase Auth.

## Frontend flow

The current app-facing watchlist integration is mobile-first.

Mobile watchlist is centered around a feature facade hook that owns:
- list query access
- screen-state derivation
- membership lookup
- optimistic add/remove actions
- refresh handling

Mutations are optimistic:
- add/remove update the local cache immediately
- failed requests roll back to the previous snapshot
- successful requests invalidate the watchlist query to resync

## Title details integration

Title details use a watchlist-specific bridge hook so the bookmark icon stays in sync with the shared watchlist cache without wiring raw query and mutation hooks in the route component.

## Web status

The shared backend and `@repo/api-client` watchlist contracts are available to web, but a dedicated web watchlist feature layer is not implemented yet.

## Current implementation files

- API client: `packages/api-client/src/watchlist.ts`
- Shared types: `packages/types/src/watchlist.ts`
- Mobile feature hooks: `apps/mobile/src/features/watchlist/hooks/*`
- Mobile query/cache utilities: `apps/mobile/src/features/watchlist/queries/*`
- Mobile UI states: `apps/mobile/src/features/watchlist/components/*`
