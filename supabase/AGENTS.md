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

## Schema and database conventions

- Prefer explicit migrations for every schema change.
- Keep table and column names consistent and descriptive.
- Add indexes only when they are justified by access patterns.
- Prefer normalized schema first; denormalize only with a clear reason.
- Keep row-level security explicit and easy to understand.
- Policies should be minimal, intentional, and aligned with authenticated vs guest access rules.
- Prefer idempotent sync/upsert logic when writing provider data.
- Keep provider-specific normalization out of SQL where possible; prefer clear server-side logic.
- Document non-obvious schema decisions in backend docs.

## Function conventions

- Keep Supabase functions small and single-purpose.
- Prefer predictable input/output shapes aligned with packages/types.
- Do not mix unrelated responsibilities in one function.
- Validate assumptions at the boundary.
- Avoid hidden side effects.
