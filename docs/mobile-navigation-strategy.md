# Mobile Navigation Strategy

This document captures the current intended mobile navigation direction for
Release Radar.

## Top-Level Tabs

The intended primary tab structure is:

1. Home
2. Watchlist
3. Search
4. Profile

### Platform presentation

- On iOS, Search may use the platform-native search tab role when available.
- On Android, Search remains a regular bottom tab.
- The product capability stays the same even when the platform presentation differs.

## Profile

Profile is intended to be a guest-accessible user hub rather than a header-only
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

Profile should be treated as a real destination, not just a thin auth sheet.

## Settings

Settings is no longer intended to be a top-level tab.

Instead:

- Profile is the top-level destination
- Settings is pushed from Profile through a header action
- the current routed path lives under the Profile stack (`/profile/settings`)

This matches the intended GitHub-like pattern:

- Profile as the user hub
- Settings as a secondary routed screen

## Header Actions

Screen-owned header actions still exist and are useful for feature-specific
actions like sort, filter, and share.

Profile access is no longer treated as a persistent global header action in the
intended long-term model.

## Deferred

The following are intentionally deferred:

- final Profile information architecture
- richer signed-in Profile content beyond current account basics
- Android-specific refinements beyond the shared capability model
