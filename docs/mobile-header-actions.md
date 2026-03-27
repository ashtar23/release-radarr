# Mobile Header Actions

This document defines the current mobile header-action convention for Release Radar.

## Goals

- keep profile access consistent on top-level screens
- let screens own their header actions without duplicating placement rules
- support iOS-first native header actions
- keep Android functionally viable without forcing identical header affordances

## Global Profile Action

- On iOS, the global profile action lives on the **left**.
- On Android, the global profile action lives on the **right**.
- The profile action appears only on **top-level tab screens**.
- The profile action is hidden on:
  - profile modal routes
  - settings and account-management routes
  - pushed detail screens

The profile action is treated as a global navigation affordance, not a screen-specific action.

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
- profile remains separate from screen-owned header actions

### Android

- the profile action stays on the right for top-level screens
- screen-owned header actions do not try to mirror the iOS header-item system yet
- feature parity should still be preserved through Android-appropriate fallback UI when real actions are added

## Current Shared API

- `HeaderAction`
  - the public type used for screen-owned header action declarations
- `useTopLevelProfileHeaderOptions`
  - applies top-level profile placement by platform
- `useHeaderActions`
  - resolves screen-owned actions into the current mobile header implementation
  - currently renders iOS native right-side header items
  - filters out actions or menu items where `visible` is `false`

## Deferred

The following are intentionally deferred for now:

- real sorting/filtering/share business logic
- Android parity for the iOS native header-item system
- combining global and screen-owned actions into one unified header registry
- bottom toolbar conventions for contextual action groups

## Watchlist Seed

The watchlist tab is the first proof point for this convention.

- top-level profile placement comes from the shared top-level profile hook
- watchlist-specific actions are declared by the screen
- the first action can remain dummy while the structure is being validated
