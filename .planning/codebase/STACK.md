# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**

- TypeScript 5.9.x - Application code across `apps/*`, `packages/*`, and Supabase functions

**Secondary:**

- JavaScript / ESM - Root tooling, Supabase contract tests, and config scripts such as `supabase/tests/contracts.mjs`
- SQL - Schema and index migrations in `supabase/migrations/`

## Runtime

**Environment:**

- Node.js >=18 - Required by the workspace root in [`package.json`](soonr/package.json)
- Deno (Supabase Edge Functions runtime) - Executes `supabase/functions/api/index.ts`
- Browser runtime - React 19 web app in `apps/web`
- React Native / Expo runtime - Expo SDK 55 mobile app in `apps/mobile`

**Package Manager:**

- pnpm 9.0.0 - Workspace package manager defined in [`package.json`](soonr/package.json)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**

- Turborepo 2.8 - Monorepo task orchestration via [`turbo.json`](soonr/turbo.json)
- Expo SDK 55 + Expo Router - Native/mobile app routing and shell in `apps/mobile`
- React 19 - Shared UI foundation in both apps
- Vite 7 + TanStack Router - Web app build and routing in `apps/web`
- Supabase - Auth, Postgres, REST, and Edge Functions backend

**Testing:**

- Node `assert` + native fetch - Backend contract test harness in [`supabase/tests/contracts.mjs`](soonr/supabase/tests/contracts.mjs)
- No dedicated unit/E2E test runner is configured yet for app or package code

**Build/Dev:**

- TypeScript compiler - `check-types` in root and per-app/package scripts
- ESLint - Root linting via `turbo run lint`
- Prettier 3.7 - Formatting via root `format` script

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.58 - Auth/session management and backend access for both apps and shared client initialization
- `@tanstack/react-query` 5.90 - Server-state fetching/caching in web and mobile
- `expo` 55 / `expo-router` 55 - Native app runtime and route system
- `@tanstack/react-router` 1.166 - Web route tree and page loading
- `@repo/api-client` - Shared typed client used by both apps to call Supabase-hosted API routes

**Infrastructure:**

- `@repo/types` - Shared DTO and domain contracts for apps and backend-facing code
- `@repo/config` - Shared constants such as API path prefix and env var names
- `@repo/ui` - shadcn-style web component package
- `@gorhom/bottom-sheet` 5 - Mobile bottom-sheet infrastructure in the in-progress profile work
- `pg_trgm` extension - Enabled in Postgres for fuzzy-ish title search indexing

## Configuration

**Environment:**

- Root, app, and `supabase/.env` files are read by the backend contract test script
- Web client expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Mobile client expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Supabase function runtime expects `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optional `RAWG_API_KEY`

**Build:**

- [`turbo.json`](soonr/turbo.json) for task graph
- [`pnpm-workspace.yaml`](soonr/pnpm-workspace.yaml) for workspace membership
- Per-package `tsconfig.json` files and shared presets in `packages/typescript-config/`
- [`supabase/config.toml`](soonr/supabase/config.toml) for local Supabase services and function config

## Platform Requirements

**Development:**

- macOS/Linux/Windows with Node.js 18+
- pnpm workspace install
- Local Supabase stack for backend contract testing and API work
- Expo tooling and native toolchains for iOS/Android builds

**Production:**

- Supabase-hosted Postgres/Auth/Edge Functions backend
- Expo native clients for mobile
- Vite-built static web app consuming the same Supabase backend

---

_Stack analysis: 2026-03-17_
_Update after major dependency changes_
