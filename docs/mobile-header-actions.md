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

Screens should declare header actions through the shared mobile header-action types and hooks instead of building ad hoc native-stack items inline.

Screen-owned header actions are also expected to be **state-aware**:

- hide actions when the current screen state makes them meaningless
- prefer `visible: false` over rendering redundant controls
- use `disabled` only when the action should still be discoverable but temporarily unavailable

## Platform Policy

### iOS

- screen-owned header actions render in the header on the right
- multiple screen-owned header actions may collapse into a native menu

### Android

- screen-owned header actions do not try to mirror the iOS header-item system yet
- feature parity should still be preserved through Android-appropriate fallback UI when real actions are added

## Current Shared API

- `HeaderAction`
  - the public type used for screen-owned header action declarations
- `useHeaderActions`
  - resolves screen-owned actions into the current mobile header implementation
  - currently renders iOS native right-side header items
  - filters out actions or menu items where `visible` is `false`

## Deferred

The following are intentionally deferred for now:

- real sorting/filtering/share business logic
- Android parity for the iOS native header-item system
- bottom toolbar conventions for contextual action groups

## Watchlist Seed

The watchlist tab is the first proof point for this convention.

- watchlist-specific actions are declared by the screen
- the first action can remain dummy while the structure is being validated
