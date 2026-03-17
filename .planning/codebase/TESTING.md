# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- No general-purpose unit/integration test runner is configured at the workspace root today
- Backend contract coverage exists as a Node script in [`supabase/tests/contracts.mjs`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/tests/contracts.mjs)

**Assertion Library:**
- Node built-in `assert/strict`
- Manual fetch response checks for API contracts

**Run Commands:**
```bash
pnpm test:backend-contracts    # Run the backend contract test script against local Supabase
pnpm lint                      # Closest repo-wide safety net today
pnpm check-types               # Repo-wide type checking
pnpm --filter mobile lint      # Mobile-only lint
pnpm --filter web lint         # Web-only lint
```

## Test File Organization

**Location:**
- Current explicit tests live in `supabase/tests/`
- No `*.test.ts` or `*.spec.ts` files were found under `apps/` or `packages/`

**Naming:**
- Contract suite uses a descriptive script filename rather than a runner-specific suffix

**Structure:**
```text
supabase/
  tests/
    contracts.mjs
```

## Test Structure

**Suite Organization:**
- Single end-to-end-ish script that:
  1. loads env vars from several repo locations
  2. seeds a `titles` row via Supabase REST
  3. hits function endpoints for search/detail
  4. asserts the returned payload shape
  5. cleans up the seed row

**Patterns:**
- Arrange/act/assert is implicit inside async helper functions
- Setup and cleanup happen in `run()` with `try/finally`
- The test exercises the real local backend stack rather than mocks

## Mocking

**Framework:**
- None currently

**Patterns:**
- External services are avoided by seeding local data directly
- RAWG is not mocked in committed test code; the contract suite is designed to pass without requiring RAWG if seeded data is sufficient

**What to Mock (when a runner is added):**
- RAWG network calls
- Supabase auth/session events in app tests
- Time-based freshness checks

**What NOT to Mock:**
- Shared pure mapping and formatting helpers
- Zod schemas and shared type contracts

## Fixtures and Factories

**Test Data:**
- Inline seed constants (`seedId`, `seedName`, `now`) are used inside the contract script
- There is no shared fixtures/factories directory yet

**Location:**
- Currently embedded directly in `supabase/tests/contracts.mjs`

## Coverage

**Requirements:**
- No enforced coverage threshold
- No coverage reporting setup is present

**Configuration:**
- None today

## Test Types

**Contract / Integration Tests:**
- Scope: Local Supabase REST + Edge Function behavior for title search and detail retrieval
- Mocking: Minimal; prefers real local services
- Trigger: `pnpm test:backend-contracts`

**Unit Tests:**
- Status: Not implemented yet for apps, packages, or backend helpers

**E2E Tests:**
- Status: Not implemented yet for web or mobile

## Common Patterns

**Async Testing:**
```js
const response = await fetch(url, { headers });
if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${await response.text()}`);
}
const payload = await response.json();
assert.equal(Array.isArray(payload.results), true);
```

**Error Testing:**
- Not formalized yet; current test script mostly validates happy-path contracts and setup failures

**Snapshot Testing:**
- Not used

## Practical Guidance

- For backend changes, extend `supabase/tests/contracts.mjs` first if the contract surface changes
- For shared package logic, a lightweight unit runner will need to be introduced before meaningful test patterns can emerge
- For UI work, lint and typecheck are currently the only consistent guardrails, so manual verification still matters

---
*Testing analysis: 2026-03-17*
*Update when test patterns change*
