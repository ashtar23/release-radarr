# AGENTS.md

## Project overview

This is a Turborepo monorepo for Release Radar, a game release tracking application.

The project currently contains:

- `apps/mobile`: Expo SDK 55 mobile app
- `apps/web`: Vite + React web app
- `packages/*`: shared workspace packages
- `supabase/`: backend schema and server-side logic
- `docs/`: project documentation

The MVP is focused on **games only**.

Users can search for games as guests. Authenticated users can manage a watchlist and receive notifications for release changes and approaching releases.

## Workspace structure

- `apps/mobile` — Expo Router mobile application
- `apps/web` — Vite + React web application
- `packages/types` — shared domain types and DTO schemas
- `packages/api-client` — shared typed client for backend access
- `packages/config` — shared config/constants when needed
- `supabase` — database migrations, functions, backend docs
- `docs` — product and architecture documentation

## Working agreements

- Prefer minimal, localized changes.
- Preserve existing architecture and naming conventions.
- Do not introduce new dependencies unless explicitly asked.
- Reuse existing hooks, components, utilities, and shared packages before creating new ones.
- Keep TypeScript strict and avoid `any`.
- Do not assume project structure; inspect the repository first.
- Prefer repository and directory-specific `AGENTS.md` guidance over global defaults when more specific guidance exists.

## Product boundaries

MVP includes:

- guest search
- email/password auth
- title details
- watchlist add/remove
- notification preferences
- in-app notifications
- push support shortly after initial notification records

Not MVP:

- movies / TV support
- store pricing
- preorder tracking
- admin dashboards
- passkeys

## Architecture rules

- RAWG is the external provider for game metadata.
- Clients must not call RAWG directly.
- Backend is Supabase-first.
- Search should use DB-first lookup with RAWG fallback and cache fill.
- Shared contracts belong in `packages/types`.
- Shared request logic belongs in `packages/api-client`.
- Web and mobile should stay presentation-focused and avoid backend/provider logic.
- Workspace TypeScript packages are source-exported and consumed by bundlers/transpilers.
- Prefer bundler-style TypeScript resolution for shared app workspace packages.
- Do not use `.js` suffixes in internal TypeScript relative imports unless the package explicitly targets NodeNext runtime behavior.

## Verification

After code changes:

- run lint
- run check-types
- run the smallest relevant verification for the affected app/package
- explain any commands that could not be run

## Output expectations

For implementation tasks:

1. explain the plan first
2. make the code change
3. summarize changed files
4. list verification steps run
5. list optional follow-ups separately
