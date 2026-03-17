# Release Radar

## What This Is

Release Radar is a game release tracking app built as a Turborepo with web and mobile clients backed by Supabase. Guests can already search for games, browse results, and open title details; the remaining MVP work is about turning that browsing experience into a personalized tracking product with watchlists and notifications.

## Core Value

Users can reliably track the game releases they care about and get notified when something important changes.

## Requirements

### Validated

- ✓ Guests can search for games from cached/backend-backed results on web and mobile — existing
- ✓ Guests can open title details and view platform/release metadata — existing
- ✓ Users can sign up, sign in, and sign out with Supabase email/password auth — existing
- ✓ Shared packages already define the API path, client initialization, and typed title/auth contracts — existing

### Active

- [ ] Authenticated users can add and remove titles from a watchlist
- [ ] Authenticated users can configure notification preferences for supported event types
- [ ] Users can view in-app notification records
- [ ] Backend generates notification events for release changes and approaching releases
- [ ] Mobile app can register for and receive push notifications after the in-app pipeline is working

### Out of Scope

- Movies / TV support — MVP is intentionally games-only
- Store pricing and preorder tracking — useful later, but not required for core release tracking
- Admin dashboards/tooling — not part of the initial user-facing MVP
- Passkey authentication — email/password is sufficient for the first release

## Context

- The codebase is a brownfield Turborepo with `apps/mobile`, `apps/web`, `packages/*`, and `supabase/`
- Existing backend work already implements the DB-first search flow with RAWG fallback and a cached `titles` table
- Both clients already have Supabase auth bootstrapping and title search/detail surfaces
- Shared packages already hold the core API client, contracts, and configuration constants, so new product work should keep presentation logic in apps and backend/provider logic in Supabase/shared packages
- The next meaningful milestone is shifting from guest browsing into authenticated tracking and notification workflows
- Current codebase concerns include duplicated auth/query patterns across apps, limited automated test coverage, and active in-progress mobile UI changes on this branch

## Constraints

- **Architecture**: Supabase-first backend with RAWG behind the backend only — clients must not call RAWG directly
- **Product Scope**: MVP is games only — roadmap should not spend phases on movies/TV or admin features
- **Code Sharing**: Shared contracts belong in `packages/types` and shared request logic belongs in `packages/api-client` — avoid duplicating backend logic in apps
- **Compatibility**: Preserve Expo SDK 55 mobile compatibility and the current Vite + React web setup — keep changes incremental and localized
- **Security**: Client apps may use only Supabase URL + publishable key — service-role credentials remain server/test only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep Release Radar as a brownfield initialization | The repo already has working guest/auth/title foundations that should be treated as validated, not hypothetical | — Pending |
| Plan remaining MVP work around watchlists and notifications | Existing guest browsing is already in place; the product gap is personalized tracking | — Pending |
| Keep web/mobile presentation-focused and backend/provider logic centralized | This matches current AGENTS guidance and existing package boundaries | — Pending |
| Treat in-app notifications as the first delivery target, with push immediately after | This follows the documented notification design and reduces early delivery complexity | — Pending |

---
*Last updated: 2026-03-17 after initialization*
