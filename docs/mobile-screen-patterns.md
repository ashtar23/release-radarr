# Mobile Screen Patterns

This document captures the current screen-composition rules for the mobile app.

The goal is to keep feature screens consistent across the current mobile
surfaces instead of letting each screen invent its own loading, error, auth,
and empty-state split.

## Core rule

For feature screens, prefer this split:

1. raw `queries/` and `mutations/` stay React Query-native and avoid UI mode logic
2. a thin `use-...-screen` hook composes auth, query state, and screen callbacks
3. a pure `screen-state/derive-...` helper maps inputs to a discriminated union
4. the screen renders one `ready` vs `non-ready` branch
5. a feature-specific `...StateView` owns non-ready rendering
6. shared centered state primitives are reused underneath

This keeps data orchestration close to the feature while avoiding large mixed
“everything in one component” render functions or giant hooks full of nested
ternaries.

## Shared primitives

### `ScreenScrollView`

File:

- [apps/mobile/src/components/screen-scroll-view.tsx](../apps/mobile/src/components/screen-scroll-view.tsx)

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

- [apps/mobile/src/components/screen-prompt.tsx](../apps/mobile/src/components/screen-prompt.tsx)

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

- [apps/mobile/src/components/empty-state.tsx](../apps/mobile/src/components/empty-state.tsx)

Use for:

- lightweight empty states
- no-results states
- simple informational placeholders

Do not use `EmptyState` when the screen needs:

- a stacked page shell
- a signed-out/access prompt treatment
- screen-owned follow-up layout that is more than a simple centered state

For full-screen centered loading, request-error, config-error, and empty states,
prefer the shared wrappers in `apps/mobile/src/components/centered-*.tsx`.

## Feature-level state views

When a screen has multiple non-ready states, prefer a feature-specific
`...StateView` rather than pushing that branching inline forever.

### Good current examples

- [apps/mobile/src/features/home/components/home-state-view.tsx](../apps/mobile/src/features/home/components/home-state-view.tsx)
- [apps/mobile/src/features/notifications/components/notifications-state-view.tsx](../apps/mobile/src/features/notifications/components/notifications-state-view.tsx)
- [apps/mobile/src/features/notifications/components/notifications-settings-state-view.tsx](../apps/mobile/src/features/notifications/components/notifications-settings-state-view.tsx)
- [apps/mobile/src/features/search/components/search-state-view.tsx](../apps/mobile/src/features/search/components/search-state-view.tsx)
- [apps/mobile/src/features/title-details/components/title-details-state-view.tsx](../apps/mobile/src/features/title-details/components/title-details-state-view.tsx)
- [apps/mobile/src/features/watchlist/components/watchlist-state-view.tsx](../apps/mobile/src/features/watchlist/components/watchlist-state-view.tsx)
- [apps/mobile/src/features/account/components/account-state-view.tsx](../apps/mobile/src/features/account/components/account-state-view.tsx)

### Recommended default split

- feature screen:
  - call a thin `use-...-screen` hook
  - render success content
- feature `...StateView`:
  - loading
  - request-error
  - config/setup problems
  - signed-out or other non-ready visual states
- feature `screen-state/`:
  - define the union
  - keep derivation pure and testable
- raw query/mutation hooks:
  - own query keys, request functions, optimistic updates, and invalidation
  - do not return screen-specific UI modes

### Home as the reference

Use [use-home-screen.ts](../apps/mobile/src/features/home/hooks/use-home-screen.ts),
[home-screen.tsx](../apps/mobile/src/features/home/components/home-screen.tsx),
and [home-state-view.tsx](../apps/mobile/src/features/home/components/home-state-view.tsx)
as the current guest-screen reference pattern:

- raw query stays in `queries/`
- `useHomeScreen()` composes and derives the mode
- `HomeStateView` owns blocking states
- successful content renders only on `ready`

For an auth-gated reference, use:

- [use-notifications-screen.ts](../apps/mobile/src/features/notifications/hooks/use-notifications-screen.ts)
- [derive-notifications-screen-state.ts](../apps/mobile/src/features/notifications/screen-state/derive-notifications-screen-state.ts)
- [notifications-screen.tsx](../apps/mobile/src/features/notifications/components/notifications-screen.tsx)
- [notifications-state-view.tsx](../apps/mobile/src/features/notifications/components/notifications-state-view.tsx)

## Header/title rules

Shared stack styling belongs in:

- [apps/mobile/src/constants/navigation.tsx](../apps/mobile/src/constants/navigation.tsx)

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
- Notifications signed-out/settings screens

### Good current `ScreenPrompt` adopters

- Account signed-out
- Notifications settings signed-out
- Notifications signed-out
- Watchlist signed-out

## Follow-up alignment work

The main structural migration is now in place for the primary mobile surfaces:

- home
- watchlist
- notifications
- notifications settings
- title details
- search
- account

Future work here should be incremental rather than another broad rewrite:

- keep docs and exports aligned as features evolve
- prefer localized cleanup over introducing new generic screen abstractions
- only revisit the architecture if a new feature genuinely breaks this pattern
