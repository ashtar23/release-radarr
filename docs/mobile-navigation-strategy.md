# Mobile Navigation Strategy

This document captures both the current mobile navigation direction in the app
and the next planned navigation step.

## Current top-level tabs

The current primary tab structure is:

1. Home
2. Watchlist
3. Search
4. Account

## Planned top-level tabs

The next planned tab structure is:

1. Home
2. Watchlist
3. Notifications
4. Search
5. Account

### Platform presentation

- On iOS, Search may use the platform-native search tab role when available.
- On Android, Search remains a regular bottom tab.
- The product capability stays the same even when the platform presentation differs.

## Account

Account is intended to be a guest-accessible user hub rather than a header-only
entry point.

### Guest state

- sign in
- sign up
- explanation of what account features unlock

### Signed-in state

- account identity
- account management entry points
- preferences
- sign out

Account should be treated as a real destination, not just a thin auth sheet.

## Settings

Settings is no longer intended to be a top-level tab.

Instead:

- Account is the top-level destination
- Settings is pushed from Account through a header action
- the current routed path lives under the Account stack (`/account/settings`)

This matches the intended GitHub-like pattern:

- Account as the user hub
- Settings as a secondary routed screen

## Notifications

Notifications is the next planned top-level destination.

The intended role is:

- first-class bottom tab
- watchlist-focused in-app feed
- signed-out explainer instead of forced auth redirect
- unread badge on the tab

The full product and implementation direction lives in:

- [docs/notifications.md](/Users/vladimirturkonja/Documents/Developer/release-radarr/docs/notifications.md)

## Header Actions

Screen-owned header actions still exist and are useful for feature-specific
actions like sort, filter, and share.

Account access is no longer treated as a persistent global header action in the
intended long-term model.

## Deferred

The following are intentionally deferred:

- final Account information architecture
- richer signed-in Account content beyond current account basics
- Android-specific refinements beyond the shared capability model
