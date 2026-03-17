# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- kebab-case for most source files across apps, packages, and Supabase code
- Expo Router route conventions use `_layout.tsx`, `index.tsx`, dynamic segments like `[titleId].tsx`, and route groups like `(tabs)`
- `index.ts` barrel files are common in shared packages and some feature folders

**Functions:**
- camelCase for functions and helpers (`createReleaseRadarApiClient`, `handleSearchRequest`)
- Async functions do not use an `async` prefix; names describe the action
- Event/route handlers typically use `handle*` or `use*` naming

**Variables:**
- camelCase for local variables and state
- UPPER_SNAKE_CASE for exported constants and env-name maps (`API_PATH_PREFIX`, `SUPABASE_WEB_ENV`)
- No underscore prefix convention for private values

**Types:**
- PascalCase for interfaces and type aliases
- Props interfaces are suffixed with `Props`
- String unions are preferred over enums in the observed code

## Code Style

**Formatting:**
- Prettier is the formatter via the root `format` script
- Double quotes are used consistently
- Semicolons are required
- Trailing commas and multi-line wrapping follow Prettier defaults

**Linting:**
- ESLint runs through Turborepo at the root and per-package/app scripts
- Expo app uses `expo lint`
- Shared lint config packages exist in `packages/eslint-config`

## Import Organization

**Order:**
1. External packages
2. Internal aliased imports (`@/`, `@repo/`)
3. Relative imports

**Grouping:**
- Blank lines usually separate external, aliased, and relative groups
- Some files place `import type` inline with value imports, others split them; consistency is moderate rather than strict

**Path Aliases:**
- `@/` maps to the local app `src/` directory in web and mobile
- `@repo/*` addresses workspace packages

## Error Handling

**Patterns:**
- Throw `Error` objects at boundaries when config is missing, responses are invalid, or requests fail
- Query/UI layers convert unknown failures into short user-facing messages
- Edge function catches top-level exceptions and returns JSON errors

**Error Types:**
- No custom error class hierarchy yet
- Expected configuration failures are often surfaced as nullable `configError` strings
- Repository helpers throw immediately on Supabase query failures

## Logging

**Framework:**
- No structured logging framework is installed
- Contract tests use `console.log` / `console.error`

**Patterns:**
- Runtime application code currently relies more on surfaced errors than logs
- There is no central logging abstraction to follow yet

## Comments

**When to Comment:**
- Comments are sparse and usually explain platform/runtime constraints
- Good examples explain why a platform-specific decision exists, such as static Expo env access in [`apps/mobile/src/lib/supabase.ts`](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/lib/supabase.ts)

**JSDoc/TSDoc:**
- Rare in the current codebase
- Types and naming are expected to carry most of the explanation

**TODO Comments:**
- No meaningful committed `TODO`/`FIXME` pattern showed up in the current source scan

## Function Design

**Size:**
- Small and medium-sized functions are preferred, especially in shared packages and backend helpers
- UI page components can be larger when they inline state and rendering branches

**Parameters:**
- Object parameters are used when requests/options have more than one field
- Direct positional params are still common for simple helpers and mutations

**Return Values:**
- Guard clauses and early returns are common
- Config initializers often return structured objects rather than throwing immediately

## Module Design

**Exports:**
- Named exports dominate in packages and utilities
- Default exports are mainly used for route/screen components required by frameworks

**Barrel Files:**
- Used selectively in packages and web feature folders
- Not every directory has a barrel; the pattern is pragmatic rather than universal

## Framework-Specific Patterns

**React / React Native:**
- Server state goes through React Query rather than ad hoc `useEffect` fetches
- Auth state is provided through React context + Supabase subscriptions
- Presentational screens/pages compose smaller components and hooks when that structure already exists

**Supabase / Backend:**
- Provider-specific normalization stays in mapping/provider modules, not in SQL
- Search/detail handlers follow thin orchestration over repository + mapper helpers
- Shared contracts from `@repo/types` are preferred over re-declaring API shapes in apps

---
*Convention analysis: 2026-03-17*
*Update when patterns change*
