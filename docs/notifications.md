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
- pull-to-refresh is supported
- app-focus revalidation is wired through React Query's native focus integration
- realtime subscriptions keep notification records and preferences fresh
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

When an authenticated user has no notifications, the tab should show a neutral empty state that explains that Soonr will surface important watchlist release changes here.

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
5. clients read notification records from the hosted API endpoints
6. clients mark records as read when opened

For `release_approaching`, the daily scheduled job should:

- start from titles whose `earliest_release_date` is within the next 30 days
- then join watchlists and notification preferences for only that smaller title set
- then evaluate exact timing preset matches (`on_day`, `24 hours`, `7 days`, `30 days`)

This keeps behavior the same while making the daily scan cost depend more on near-term releases and their watchers than on total watchlist size across the whole product.

### `release_approaching` staging verification

Use these queries in staging after applying the optimization migration:

```sql
explain analyze
select
  t.id,
  t.earliest_release_date
from public.titles t
where t.earliest_release_date between current_date and current_date + 30;
```

```sql
explain analyze
with due_titles_window as (
  select
    t.id as title_id,
    t.earliest_release_date as target_release_date
  from public.titles t
  where t.earliest_release_date between current_date and current_date + 30
)
select
  w.user_id,
  dtw.title_id,
  dtw.target_release_date
from due_titles_window dtw
join public.watchlists w on w.title_id = dtw.title_id;
```

Good signs:

- the planner can use `titles_earliest_release_date_idx` for the date-window filter
- date-window filtering happens before the wider watchlist join
- `watchlists(title_id)` supports the join path from `due_titles_window`
- the working set is visibly smaller than an unbounded scan of all watchlist rows

## Backend support needed

The backend should expose support for:

- listing notifications for the current user
- reading an unread count for the current user
- marking an individual notification as read
- reading and updating notification preferences

V1 does not require:

- grouped notification summaries
- push delivery fan-out
- per-title preference overrides

If the single daily `release_approaching` batch later becomes a bottleneck, the next scale step should keep the same due-title selection logic and focus on batching `notification_records` fan-out or splitting fan-out into a second phase/job. That follow-up should not change timing preset behavior, event key semantics, or reminder cadence. Triggers for that follow-up are long cron runtimes, large `notification_records` spikes per run, or very popular titles producing heavy single-run fan-out.

## Freshness model

Current mobile freshness behavior is:

- the notifications list uses cursor-based infinite pagination
- app foreground/background focus is wired globally through React Query native focus handling
- the notifications provider subscribes to realtime updates for:
  - `notification_records`
  - `notification_preferences`
- unread-count and feed queries are invalidated on relevant record changes
- preferences are patched directly into cache when newer realtime payloads arrive
- preferences updates are written optimistically on the client and debounced before persistence

Reference files:

- [apps/mobile/src/features/notifications/queries/use-notifications-query.ts](../apps/mobile/src/features/notifications/queries/use-notifications-query.ts)
- [apps/mobile/src/features/notifications/queries/use-notification-preferences-query.ts](../apps/mobile/src/features/notifications/queries/use-notification-preferences-query.ts)
- [apps/mobile/src/features/notifications/mutations/use-update-notification-preferences-mutation.ts](../apps/mobile/src/features/notifications/mutations/use-update-notification-preferences-mutation.ts)
- [apps/mobile/src/features/notifications/providers/notifications-realtime-provider.tsx](../apps/mobile/src/features/notifications/providers/notifications-realtime-provider.tsx)

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
- realtime updates keep feed, unread count, and preferences cache in sync
- disabled notification event types prevent new records from being created
- non-watchlisted titles do not create notifications in V1
