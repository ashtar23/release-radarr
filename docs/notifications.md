# Notification Design

## Summary

The notifications MVP is in-app first, watchlist-only, and built as a first-class mobile experience via a dedicated bottom tab. Push delivery remains a follow-up after the in-app pipeline is stable.

## V1 product decisions

The agreed V1 behavior is:

- Notifications is a first-class bottom tab
- tab order is `Home`, `Watchlist`, `Notifications`, `Search`, `Account`
- notifications are generated only for watchlisted titles
- the feed is flat and reverse chronological
- unread/read state exists in V1
- the tab shows an unread badge count
- tapping a notification opens the title detail screen
- opening a notification marks it as read
- signed-out users see an explainer screen instead of being redirected
- notification preferences live in Account settings
- pull-to-refresh and refetch-on-open are enough for V1
- no realtime subscriptions in V1
- no grouping, bundling, or per-title overrides in V1

## Scope

V1 delivery order is:

1. in-app notification records and feed
2. Expo push delivery after the in-app pipeline is stable

Clients remain presentation-focused and must not directly call external providers.

## Event types

Supported V1 events:

- `release_date_changed`
- `release_approaching`

## Eligibility

Notifications are generated only when:

- the user is authenticated
- the title is on the user's watchlist
- the relevant event type is enabled in that user's preferences
- timing presets allow the event to be emitted

V1 does not generate notifications for:

- titles outside a user's watchlist
- guest users
- custom per-title notification overrides

## Mobile UX

### Notifications tab

The Notifications tab is a dedicated destination in the bottom tab bar.

Authenticated users should see:

- a reverse-chronological feed
- one row per notification record
- a relative timestamp
- an unread indicator
- pull-to-refresh support

Signed-out users should see:

- a simple explainer that notifications require an account and watchlist
- no forced auth redirect from the tab itself

### Row behavior

Each notification row should:

- identify the title
- describe the event in short copy
- show when it happened
- navigate to the title detail screen when tapped
- mark itself as read when opened

### Empty state

When an authenticated user has no notifications, the tab should show a neutral empty state that explains that Release Radar will surface important watchlist release changes here.

### Badge behavior

The Notifications tab badge is based only on unread in-app notification records.

## Notification preferences

Preferences live in Account settings rather than inside the Notifications tab.

The existing shared preference model should continue to drive:

- channels
  - `inApp`
  - `push`
- event toggles
  - `releaseDateChanged`
  - `releaseApproaching`
- timing presets

Even though the model includes `push`, push delivery itself remains out of scope for V1 implementation.

## Data model (V1)

The backend should persist:

- notification preferences per user
- generated notification events
- notification records visible in-app
- read state for user-visible records
- unread-count-friendly state for badge support
- device token storage can remain schema-ready for later push support

Notification records should minimally support:

- user id
- title id
- event type
- payload/message data needed for feed rendering
- created timestamp
- read timestamp or equivalent unread state

## Generation flow

1. title release data changes or scheduled checks run
2. backend evaluates whether an event should be emitted
3. a notification event is persisted
4. user-specific notification records are created according to watchlist membership and preferences
5. clients read notification records from Supabase-backed endpoints
6. clients mark records as read when opened

## Backend support needed

The backend should expose support for:

- listing notifications for the current user
- reading an unread count for the current user
- marking an individual notification as read
- reading and updating notification preferences

V1 does not require:

- realtime subscriptions
- grouped notification summaries
- push delivery fan-out
- per-title preference overrides

## Freshness model

V1 freshness should stay simple:

- refetch when the Notifications screen is focused or opened
- support pull-to-refresh
- avoid realtime listeners until the feed and generation model are stable

## Implementation order

Recommended build order:

1. shared notification record contracts in `packages/types`
2. shared API client support in `packages/api-client`
3. Supabase schema and backend handlers for notification records and preferences
4. mobile Notifications tab and feed states
5. unread badge wiring
6. Account settings integration for preferences
7. notification generation for the two MVP event types
8. push delivery later

## Test plan

The minimum expected verification for V1 is:

- signed-out users see an explainer in the Notifications tab
- authenticated users with no records see an empty state
- authenticated users with unread records see newest-first feed rows
- unread badge count matches unread records
- tapping a notification opens the correct title detail screen
- tapping a notification marks it as read
- pull-to-refresh refreshes feed and unread count
- disabled notification event types prevent new records from being created
- non-watchlisted titles do not create notifications in V1
