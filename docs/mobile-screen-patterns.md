# Mobile Screen Patterns

This document captures the current screen-composition rules for the mobile app.

The goal is to keep feature screens consistent before adding Notifications and
future authenticated surfaces.

## Core rule

For feature screens, prefer this split:

1. the screen owns data fetching and high-level branching
2. a feature-specific `...StateView` owns non-success rendering
3. shared UI primitives are reused underneath

This keeps data orchestration close to the feature screen while avoiding large
mixed “everything in one component” render functions.

## Shared primitives

### `ScreenScrollView`

File:

- [apps/mobile/src/components/screen-scroll-view.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/components/screen-scroll-view.tsx)

Use for:

- stacked screen layouts
- settings/detail pages
- prompt-driven screens
- screens that want shared bounce, inset handling, and page padding

Do not use for:

- list-heavy screens already driven by `FlatList` / `FlashList`
- centered empty/loading state wrappers
- screens with fundamentally different scrolling behavior

`ScreenScrollView` may take a small `contentContainerStyle` override when a
screen needs to preserve its own spacing model without reimplementing scroll
behavior.

### `ScreenPrompt`

File:

- [apps/mobile/src/components/screen-prompt.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/components/screen-prompt.tsx)

Use for:

- gated feature prompts
- signed-out explainer screens
- screen-level “what this feature is for” prompts

`ScreenPrompt` owns:

- icon
- title
- description

Anything below that intro block should be passed through `actionContent`.

Use this when the screen is still a real destination and needs a stronger prompt
than a generic empty state.

### `EmptyState`

File:

- [apps/mobile/src/components/empty-state.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/components/empty-state.tsx)

Use for:

- centered empty states
- loading placeholders
- no-results states
- lightweight error messaging

Do not use `EmptyState` when the screen needs:

- a stacked page shell
- a signed-out/access prompt treatment
- screen-owned follow-up layout that is more than a simple centered state

## Feature-level state views

When a screen has multiple non-success states, prefer a feature-specific
`...StateView` rather than pushing that branching inline forever.

### Good current examples

- [apps/mobile/src/features/home/components/home-state-view.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/home/components/home-state-view.tsx)
- [apps/mobile/src/features/search/components/search-state-view.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/search/components/search-state-view.tsx)
- [apps/mobile/src/features/watchlist/components/watchlist-state-view.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/watchlist/components/watchlist-state-view.tsx)

### Recommended default split

- feature screen:
  - fetch data
  - derive mode
  - render success content
- feature `...StateView`:
  - loading
  - error
  - config/setup problems
  - other non-success visual states

### Home as the reference

Use [home-screen-content.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/home/components/home-screen-content.tsx)
plus [home-state-view.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/features/home/components/home-state-view.tsx)
as the current reference pattern:

- screen owns query and branching
- `HomeStateView` owns blocking states
- successful-but-empty discovery remains part of the success screen

## Header/title rules

Shared stack styling belongs in:

- [apps/mobile/src/constants/navigation.tsx](/Users/vladimirturkonja/Documents/Developer/release-radarr/apps/mobile/src/constants/navigation.tsx)

Keep these decisions local to the screen or layout branch:

- whether the title is hidden in signed-out mode
- whether large title is enabled for a specific tab state
- whether a prompt title should differ from the header title

Do not over-centralize those semantic header decisions into a generic helper too
early.

## Current adoption

### Good current `ScreenScrollView` adopters

- Account screen
- Account settings screens
- Home screen
- Watchlist signed-out screen

### Good current `ScreenPrompt` adopters

- Account signed-out
- Watchlist signed-out

### Likely next adopter

- Notifications signed-out state

## Follow-up alignment work

These are worth aligning when touched next, but they do not need to block the
Notifications feature:

- Account can eventually move more of its loading/config branching into a
  dedicated state view if it grows further.
- Title details could benefit from a similar split if that screen gets more
  states or richer retry/setup behavior.
