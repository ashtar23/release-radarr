# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```text
release-radarr/
├── apps/                    # User-facing clients
│   ├── mobile/              # Expo Router mobile app
│   └── web/                 # Vite + React web app
├── packages/                # Shared workspace packages
│   ├── api-client/          # Shared typed API/Supabase client helpers
│   ├── config/              # Shared constants and env names
│   ├── eslint-config/       # Shared lint presets
│   ├── types/               # Shared domain and DTO types
│   ├── typescript-config/   # Shared TS config presets
│   └── ui/                  # Shared web UI primitives
├── supabase/                # Backend config, functions, migrations, tests
├── docs/                    # Product and architecture notes
├── android/                 # Native Android project for Expo prebuild/run
├── package.json             # Root scripts and workspace metadata
├── pnpm-workspace.yaml      # Workspace membership
└── turbo.json               # Turborepo task graph
```

## Directory Purposes

**apps/mobile/**
- Purpose: Native-first Expo client
- Contains: `src/app` routes, `src/components`, `src/features`, `src/lib`, and theme/constants
- Key files: [`apps/mobile/src/app/_layout.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/app/_layout.tsx), [`apps/mobile/package.json`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/package.json)
- Subdirectories: `src/app/(tabs)` for tab routes, `src/app/(modals)` for modal routes, `src/features/search` for the search feature

**apps/web/**
- Purpose: Browser client for guest search, auth, and title details
- Contains: TanStack Router routes, feature folders, providers, and Supabase/API wiring
- Key files: [`apps/web/src/main.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/web/src/main.tsx), [`apps/web/src/router.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/web/src/router.tsx)
- Subdirectories: `src/features/*` by feature, `src/routes` for route files, `src/providers` for app-wide concerns

**packages/api-client/**
- Purpose: Shared API client creation and Supabase initialization helpers
- Contains: `src/index.ts`, `src/supabase-client.ts`
- Key files: [`packages/api-client/src/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/packages/api-client/src/index.ts)
- Subdirectories: Flat package; source-exported

**packages/types/**
- Purpose: Shared domain contracts and zod-backed input schemas
- Contains: `src/auth.ts`, `src/titles.ts`, `src/notifications.ts`, `src/watchlist.ts`
- Key files: [`packages/types/src/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/packages/types/src/index.ts)
- Subdirectories: Flat package; grouped by domain file

**packages/config/**
- Purpose: Shared constants like API path prefix and env variable names
- Contains: `src/index.ts`
- Key files: [`packages/config/src/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/packages/config/src/index.ts)
- Subdirectories: Flat package

**packages/ui/**
- Purpose: Shared web-only UI primitives
- Contains: shadcn-style `src/components/*`, utility functions, global CSS
- Key files: [`packages/ui/components.json`](/Users/vladimirturkonja/Documents/Developer/release-radarr/packages/ui/components.json), [`packages/ui/src/components/button.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/packages/ui/src/components/button.tsx)
- Subdirectories: `src/components`, `src/lib`, `src/styles`

**supabase/**
- Purpose: Backend implementation and local dev configuration
- Contains: `functions/api`, SQL migrations, contract tests, and config
- Key files: [`supabase/config.toml`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/config.toml), [`supabase/functions/api/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/index.ts)
- Subdirectories: `functions/api/{handlers,data,mapping,providers,utils}`, `migrations/`, `tests/`

## Key File Locations

**Entry Points:**
- [`apps/mobile/src/app/_layout.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/app/_layout.tsx): Mobile app shell and provider setup
- [`apps/web/src/main.tsx`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/web/src/main.tsx): Web bootstrap
- [`supabase/functions/api/index.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/index.ts): Backend function entry

**Configuration:**
- [`package.json`](/Users/vladimirturkonja/Documents/Developer/release-radarr/package.json): Root scripts and engines
- [`turbo.json`](/Users/vladimirturkonja/Documents/Developer/release-radarr/turbo.json): Task definitions
- [`pnpm-workspace.yaml`](/Users/vladimirturkonja/Documents/Developer/release-radarr/pnpm-workspace.yaml): Workspace boundaries
- [`supabase/config.toml`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/config.toml): Local Supabase services and function settings

**Core Logic:**
- [`apps/mobile/src/features/search/hooks/use-search-titles-query.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/search/hooks/use-search-titles-query.ts): Mobile search query state
- [`apps/web/src/features/search/data-access/search-titles.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/web/src/features/search/data-access/search-titles.ts): Web search data access
- [`supabase/functions/api/data/titles-repository.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/data/titles-repository.ts): Cached title reads/writes
- [`supabase/functions/api/providers/rawg.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/functions/api/providers/rawg.ts): RAWG adapter

**Testing:**
- [`supabase/tests/contracts.mjs`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/tests/contracts.mjs): Backend contract test suite
- No dedicated app/package unit test directories exist yet

**Documentation:**
- [`AGENTS.md`](/Users/vladimirturkonja/Documents/Developer/release-radarr/AGENTS.md): Repo-level working guidance
- [`docs/`](/Users/vladimirturkonja/Documents/Developer/release-radarr/docs): Product and architecture docs
- [`supabase/README.md`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/README.md): Backend notes

## Naming Conventions

**Files:**
- kebab-case for most modules: `search-panel.tsx`, `titles-repository.ts`
- Expo Router special filenames for routes/layouts: `_layout.tsx`, `[titleId].tsx`, grouped route folders like `(tabs)`
- `index.ts` / `index.tsx` for public entry files and route endpoints

**Directories:**
- feature- or concern-based lowercase directories
- plural collection names for workspace roots: `apps`, `packages`, `functions`, `migrations`
- route-group directories in Expo Router: `(tabs)`, `(modals)`

**Special Patterns:**
- `src/features/<feature>/...` in web and partially in mobile
- `lib/` for wiring shared clients
- `providers/`, `context/`, and `queries/` to separate React concerns on web

## Where to Add New Code

**New mobile feature:**
- Primary code: `apps/mobile/src/features/<feature>/` and route entry in `apps/mobile/src/app/**`
- Tests: no established home yet; add alongside feature once a test runner exists
- Shared wiring: `apps/mobile/src/lib/` only if the feature needs app-specific client setup

**New web feature:**
- Primary code: `apps/web/src/features/<feature>/`
- Route file: `apps/web/src/routes/**`
- Shared web UI primitive: `packages/ui/src/components/` if reusable beyond one feature

**New shared contract/client logic:**
- Types and schemas: `packages/types/src/`
- Shared constants: `packages/config/src/`
- Shared request logic: `packages/api-client/src/`

**New backend endpoint/data change:**
- HTTP handler/routing: `supabase/functions/api/**`
- Persistence changes: `supabase/migrations/`
- Verification: `supabase/tests/contracts.mjs` or additional backend tests

## Special Directories

**android/**
- Purpose: Native Android project generated/maintained for Expo run workflows
- Source: Expo prebuild/native tooling
- Committed: Yes

**node_modules/**, `.turbo/`, `.pnpm-store/`
- Purpose: Local dependencies and build cache
- Source: Package manager / Turborepo
- Committed: No

**.planning/**
- Purpose: GSD planning and codebase map artifacts
- Source: Agent-generated project planning docs
- Committed: Intended to be committed in this repo

---
*Structure analysis: 2026-03-17*
*Update when directory structure changes*
