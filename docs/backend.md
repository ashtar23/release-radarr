# Backend Design

## Provider model

The primary external provider is RAWG.

The backend is responsible for fetching, normalizing, caching, and serving game metadata so that clients do not consume RAWG directly.

## Search flow

1. client sends a search query
2. backend searches the local database first
3. if cached results are sufficient and fresh, return them
4. if cached results are weak or stale:
   - fetch from RAWG
   - normalize the results
   - upsert them into the database
   - return the normalized results

## Title details flow

1. client requests a title detail view
2. backend checks cached title and release data
3. if missing or stale:
   - fetch details from RAWG
   - normalize and upsert title metadata
   - normalize and upsert release/platform data
4. compare previous and new release data
5. create change events when meaningful differences are detected

## Freshness rules

Initial recommended defaults:

- search results: 7 days
- title details: 24 hours
- watched titles: refreshed daily

These values may be tuned later.

## Watchlist model

- guests can search and browse
- authenticated users can add/remove titles from watchlist
- watchlist is tracked at the title level
- platform-specific releases are shown underneath each title

## Notification model

Notification event types:

- `release_date_changed`
- `release_approaching`

Notification records should exist in-app first.
Push delivery is added immediately after the in-app pipeline is working.

## Initial backend priorities

1. auth
2. title cache/search flow
3. title detail refresh flow
4. watchlist persistence
5. notification preferences
6. notification event generation
7. push delivery
