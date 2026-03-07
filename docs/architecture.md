# Architecture Overview

## Monorepo structure

This project is a Turborepo monorepo with two client applications and shared packages.

### Applications

- `apps/mobile` — Expo SDK 55 mobile app using Expo Router
- `apps/web` — Vite + React web app

### Shared packages

Shared packages:

- `packages/types` — domain entities, DTOs, shared enums
- `packages/api-client` — shared typed client used by web and mobile
- `packages/config` — shared configuration and constants when needed

### Backend

- `supabase` — schema, functions, migrations, and backend-oriented documentation

## Responsibility split

### Mobile app

Owns:

- auth UI
- search UI
- title details UI
- watchlist UI
- settings
- notification center
- push token registration

### Web app

Owns:

- guest search
- auth UI
- title details UI
- watchlist UI
- settings
- notification center

### Backend

Owns:

- auth
- cached game catalog
- watchlists
- notification preferences
- change events
- notification records
- sync and refresh logic

## Data ownership

RAWG is the external metadata provider for games.

The database stores:

- cached title data
- release/platform data
- user watchlists
- notification preferences
- change events
- notification records
- device tokens later

Clients do not talk to RAWG directly.

## Current architectural direction

- game-only MVP
- Supabase-first backend
- DB-first search with RAWG fallback
- in-app notifications first
- Expo push delivery shortly after
