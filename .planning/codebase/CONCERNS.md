# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**Duplicated auth/session provider logic across apps:**
- Issue: Web and mobile both maintain near-identical Supabase auth provider implementations
- Why: Fast parallel setup of the two clients before a shared React-specific package existed
- Impact: Auth bug fixes or behavior changes must be applied twice and can drift
- Fix approach: Extract a shared framework-compatible auth adapter or at least align behavior behind shared utilities

**Search/title detail feature parity implemented twice:**
- Issue: Search and title-details flows are duplicated per app with only presentation differences
- Why: UI frameworks differ, but the query/data-access logic is still very similar
- Impact: Higher maintenance cost and easier inconsistency in edge-case handling
- Fix approach: Share more feature logic in framework-agnostic helpers and keep only rendering-specific code in apps

**Backend API surface is still narrow and partially scaffolded:**
- Issue: `health()` in `@repo/api-client` intentionally throws because endpoints are not scaffolded yet
- Why: API client was created ahead of full backend expansion
- Impact: Some shared client surface looks available but is unusable
- Fix approach: Either scaffold the endpoint or remove/defer the API surface until needed

## Known Bugs

**Profile button routes to a path that does not match the current modal route group:**
- Symptoms: `router.push("/profile")` in the mobile header button may not resolve to the existing `(modals)/profile` route the way intended
- Trigger: Tapping the profile header button
- Workaround: None confirmed from the repo scan
- Root cause: Route path and grouped file path naming appear out of sync
- Blocked by: Needs runtime verification after the in-progress profile work settles

**Current mobile button/sheet work is mid-flight on the branch:**
- Symptoms: Multiple modified/untracked files in `apps/mobile/src/components/ui/*` and sheet/profile areas
- Trigger: Ongoing feature work
- Workaround: Treat the mobile UI layer as moving target until the branch stabilizes
- Root cause: Active implementation in progress, not necessarily a defect

## Security Considerations

**Edge Function JWT verification is disabled in config:**
- Risk: [`supabase/config.toml`](/Users/vladimirturkonja/Documents/Developer/release-radarr/supabase/config.toml) sets `[functions.api] verify_jwt = false`, which weakens trust in caller identity if carried to non-local environments
- Current mitigation: Clients still send Supabase bearer tokens, but the function itself is not enforcing verification at the function gateway level
- Recommendations: Confirm this is local-dev only and document/enforce the intended production posture

**Service-role usage in backend and tests:**
- Risk: Service-role credentials bypass RLS and are highly sensitive
- Current mitigation: They are only read from environment variables and not committed
- Recommendations: Keep service-role use confined to backend/test contexts and avoid exposing these values in docs, logs, or client code

## Performance Bottlenecks

**Title search uses `ilike('%query%')` over cached names:**
- Problem: Substring search can degrade as the `titles` table grows
- Measurement: No runtime numbers captured yet
- Cause: Simplicity-first query design in `titles-repository.ts`
- Improvement path: Lean more on the trigram index already added, consider ranking, and monitor query plans as data grows

**Cold cache requests depend on synchronous RAWG fetches:**
- Problem: Low-cache searches/details can block on external network latency
- Measurement: No p95 figures in repo
- Cause: RAWG fallback happens in the request path before responding
- Improvement path: Add background refresh or partial-stale responses if latency becomes noticeable

## Fragile Areas

**Supabase function cache freshness flow:**
- Why fragile: Search/detail behavior depends on several freshness heuristics, env vars, and DB state
- Common failures: Unexpected fallback behavior, stale data not refreshing, or local-only behavior differing from hosted environments
- Safe modification: Change freshness logic and upsert flow together, then rerun backend contract tests
- Test coverage: Only basic backend contract coverage exists

**Mobile platform-specific button renderer stack:**
- Why fragile: Multiple platform files (`button-renderer.android.tsx`, `button-renderer.ios.tsx`, shared tokens) are currently changing together
- Common failures: Style regressions or capability mismatches across iOS/Android
- Safe modification: Inspect all platform renderer files together and verify on-device/simulator
- Test coverage: No automated coverage found

## Scaling Limits

**Single-table metadata cache:**
- Current capacity: Fine for MVP-scale search/detail cache
- Limit: As more title data, watchlists, notifications, and history arrive, one cache table will not cover all domain needs
- Symptoms at limit: Slower queries, overloaded responsibilities, awkward schema growth
- Scaling path: Introduce normalized relational tables for watchlists, notification state, and release history as MVP expands

## Dependencies at Risk

**Expo SDK / React Native churn:**
- Risk: Mobile stack is on very recent Expo SDK 55 and React Native 0.83; UI packages and platform APIs can shift quickly
- Impact: Native UI work and custom components may need follow-up fixes during upgrades
- Migration plan: Keep mobile abstractions thin and follow Expo-first patterns already documented in AGENTS guidance

## Missing Critical Features

**No automated UI/unit testing for apps and packages:**
- Problem: Most regressions will rely on manual discovery
- Current workaround: Lint, typecheck, and manual local verification
- Blocks: Confident refactoring of shared logic and UI-heavy changes
- Implementation complexity: Medium; requires choosing a test runner and app-specific harness strategy

**No watchlist/notification persistence yet in committed backend schema:**
- Problem: Project goals mention watchlists and notifications, but committed schema/functions currently cover title cache/search/detail only
- Current workaround: Search and detail browsing can proceed without those features
- Blocks: Full MVP delivery
- Implementation complexity: Medium to high, depending on notification model and auth/RLS requirements

## Test Coverage Gaps

**Mobile app routes and custom UI components:**
- What's not tested: Search screen, title details screen, bottom sheets, custom button system
- Risk: Navigation and styling regressions can ship unnoticed
- Priority: High
- Difficulty to test: Moderate, requires React Native/Expo-compatible test setup

**Web feature flows:**
- What's not tested: Auth form, search panel, title details page
- Risk: Query and form regressions are only caught manually
- Priority: High
- Difficulty to test: Low to medium once a browser/unit runner is introduced

**Backend repository/mapping edge cases:**
- What's not tested: Freshness edge cases, malformed RAWG payload handling, database error branches
- Risk: Production-only failures or stale-cache bugs
- Priority: Medium
- Difficulty to test: Medium

---
*Concerns audit: 2026-03-17*
*Update as issues are fixed or new ones discovered*
