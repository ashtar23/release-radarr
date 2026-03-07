# Supabase Backend Guidance

## Project overview

This directory contains backend-related resources such as migrations, functions, and backend docs.

The backend is responsible for serving both the mobile and web apps.

## Responsibilities

The backend manages:

- authentication
- title metadata caching
- release/platform data
- watchlists
- notification preferences
- change event generation
- notification records
- push delivery support later

## Data rules

- RAWG is the external metadata provider.
- Clients must never call RAWG directly.
- Search should be DB-first with RAWG fallback and cache fill.
- Keep schema and functions understandable and maintainable.
- Prefer idempotent sync logic where possible.

## Working agreements

- Keep database changes explicit and migration-driven.
- Avoid overengineering early.
- Start with the MVP event model only:
  - `release_date_changed`
  - `release_approaching`
- Design schema to support push from day one, even if push delivery is added shortly after.
