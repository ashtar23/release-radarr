# Phase 2: Watchlist Core - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 adds watchlist persistence plus add/remove/view flows across backend, web, and mobile for authenticated users. This phase clarifies how users enter the watchlist flow, how the watchlist looks in each client, and how signed-out users are routed into auth without expanding into notification behavior or other new capabilities.

</domain>

<decisions>
## Implementation Decisions

### Add/remove entry points
- Add to watchlist from title details only.
- Remove from watchlist from title details and from the watchlist screen itself.
- Search results do not include watchlist add/remove actions in Phase 2.
- Title details should place the watchlist action in the header/navigation area.
- Add/remove should feel immediate with no confirmation step.
- On mobile, removal from the watchlist screen should use swipe-to-remove.
- On web, removal from the watchlist screen should use a direct visible remove action.

### Watchlist screen shape
- Web watchlist should use a medium-density card grid.
- Mobile watchlist should use a richer visual list rather than a compact utility list.
- Empty watchlist states should include suggested titles or trending games, not just static copy.

### Signed-out behavior
- Guests should still see watchlist-related affordances instead of the feature being completely hidden.
- The watchlist tab should show a centered sign-in CTA with copy explaining that login is required to view and use the watchlist.
- That watchlist CTA should open the profile modal / sign-in flow.
- Title details should still show the header watchlist action for guests.
- Tapping the guest header watchlist action should also open the profile modal / sign-in flow.
- After signing in from one of these prompts, users should return to where they were and retry the watchlist action manually.

### Saved item detail
- Each watchlist item should show title name, cover art, and the primary release date.
- Platforms do not need to appear in the Phase 2 at-a-glance watchlist item view.
- Release date presentation should use the best available precision when known, and fall back to a friendly TBA-style label when not known.
- `addedAt` should not be shown in the watchlist UI.
- Titles without cover art should use a simple generic game placeholder.

### Claude's Discretion
- Exact CTA copy for signed-out watchlist prompts.
- Exact visual styling of the web card grid and mobile rich list.
- Exact placeholder art treatment for missing cover images.
- Exact interaction details for optimistic watchlist updates and loading states.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `docs/product.md` — Defines guest vs authenticated behavior, watchlist inclusion in MVP, and non-goals.
- `.planning/PROJECT.md` — Brownfield project context, validated foundations, and active MVP priorities.
- `.planning/REQUIREMENTS.md` — Watchlist requirements `WATCH-01` through `WATCH-04` and adjacent MVP boundaries.
- `.planning/ROADMAP.md` — Phase 2 scope, success criteria, and sequencing constraints.

### Architecture and backend behavior
- `docs/architecture.md` — Confirms responsibility split between clients, shared packages, and backend ownership of watchlists.
- `docs/backend.md` — States that watchlist is tracked at the title level and belongs after auth/title cache flows.
- `supabase/AGENTS.md` — Backend guidance for schema changes, RLS clarity, and Supabase-first implementation.

### Mobile navigation and existing UX structure
- `docs/mobile-navigation.md` — Defines the current mobile tab/stack structure and confirms the dedicated watchlist tab branch.
- `apps/mobile/AGENTS.md` — Mobile-specific presentation and routing conventions to preserve while adding watchlist UX.
- `apps/web/AGENTS.md` — Web-specific expectations for presentation-focused feature work and data-fetching patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/types/src/watchlist.ts`: Existing `WatchlistItem` contract already includes `title`, `releases`, and `addedAt`; Phase 2 can reuse this as the shared watchlist DTO shape.
- `apps/mobile/src/components/list-row.tsx`: Reusable row primitive for a list-based mobile watchlist presentation.
- `apps/mobile/src/components/list-section.tsx`: Existing grouped/list container that can support the richer mobile list styling.
- `apps/mobile/src/app/titles/[titleId].tsx`: Existing title details screen where the header watchlist action should integrate.
- `apps/mobile/src/app/(modals)/profile.tsx`: Existing profile modal destination for sign-in prompts.
- `packages/ui/src/components/card.tsx`: Reusable web card primitive aligned with the chosen grid-based watchlist direction.
- `apps/web/src/features/titles/pages/title-details-page.tsx`: Existing web title-details page where the watchlist action can be added.

### Established Patterns
- Web and mobile both use Supabase auth providers plus shared API client wiring; watchlist access should follow the same authenticated-user boundary.
- Remote data fetching is already handled with React Query in both apps; watchlist fetch/mutation flows should align with that pattern.
- Shared contracts and request helpers belong in `packages/types` and `packages/api-client`, not duplicated separately in each app.
- Mobile navigation already includes a dedicated watchlist tab branch under `apps/mobile/src/app/(tabs)/watchlist/`.

### Integration Points
- Backend persistence will need new Supabase schema/RLS plus API surfaces that connect to existing auth and cached titles.
- Mobile watchlist UI will connect to the existing watchlist tab and title-details header.
- Web watchlist UI will need a new route/page plus a title-details header action.
- Guest sign-in prompts should route through the existing profile modal flow rather than inventing a separate auth entry point.

</code_context>

<specifics>
## Specific Ideas

- The watchlist should feel intentionally different between platforms: richer list on mobile, medium-density grid on web.
- Signed-out watchlist affordances should not disappear; they should guide users into the profile modal/sign-in flow.
- Watchlist items should stay release-focused and lightweight: cover art, title, and primary date only.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 02-watchlist-core*
*Context gathered: 2026-03-17*
