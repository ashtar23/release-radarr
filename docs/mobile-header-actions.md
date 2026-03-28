# Mobile Header Actions

This document defines the current mobile header-action convention for Release Radar.

## Goals

- let screens own their header actions without duplicating placement rules
- support iOS-first native header actions
- keep Android functionally viable without forcing identical header affordances

## Screen-Owned Header Actions

In phase one, header actions are owned by the screen and rendered on the
**right** on iOS.

The first version supports:

1. no screen-owned header actions
2. one visible action
3. one menu containing multiple actions

Menu items currently remain flat, but they can express common native states:

- `destructive`
- `isOn`

Screens should declare header actions through the shared mobile header-action types and renderer instead of building ad hoc native-stack items inline.

Screen-owned header actions are also expected to be **state-aware**:

- hide actions when the current screen state makes them meaningless
- prefer `visible: false` over rendering redundant controls
- use `disabled` only when the action should still be discoverable but temporarily unavailable

## Platform Policy

### iOS

- screen-owned header actions render in the header on the right
- the system can auto-collapse toolbar items when space runs out
- screens should still declare a native menu intentionally when they want grouped actions rather than relying on overflow alone

### Android

- supports up to two visible button actions in `headerRight`
- menu actions are not rendered yet
- feature parity should still be preserved through Android-appropriate fallback UI when real actions are added

## Current Shared API

- `HeaderAction`
  - the public type used for screen-owned header action declarations
- `HeaderButtonAction`
  - supports either:
    - `href` for declarative navigation actions
    - `onPress` for command-style actions
- `HeaderActions`
  - the shared renderer component for screen-owned top-right actions
  - filters out actions or menu items where `visible` is `false`
  - renders full button + menu support on iOS via `Stack.Toolbar`
  - renders up to two visible button actions on Android via `headerRight`
  - intentionally defers Android menu support for now
  - supports flat menu item states like `destructive` and `isOn` on iOS

## Deferred

The following are intentionally deferred for now:

- real sorting/filtering/share business logic
- Android parity for the iOS toolbar system
- nested submenu support
- bottom toolbar conventions for contextual action groups

## Watchlist Seed

The watchlist tab is the first proof point for this convention.

- watchlist-specific actions are declared by the screen
- the first action can remain dummy while the structure is being validated
