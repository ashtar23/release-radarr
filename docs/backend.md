# Backend Design

## Provider model

RAWG is the only external metadata provider. The backend fetches, normalizes, caches, and serves game data so clients never talk to RAWG directly.

## Edge API boundary

The client-facing backend is the Supabase Edge Function namespace:
- `/functions/v1/api/titles`
- `/functions/v1/api/titles/:id`
- `/functions/v1/api/watchlist`

Web and mobile call those routes through `@repo/api-client` only.

## Search flow

1. client sends a search query with page and limit
2. backend checks the local database first
3. if the local page is sufficient and fresh, return it
4. if the local page is weak or stale:
   - fetch from RAWG
   - normalize results into internal title summaries
   - upsert them into the local cache
   - return the merged ranked page

Search responses include pagination metadata so the client can drive infinite scroll without guessing.

## Title details flow

1. client requests a title detail view
2. backend checks cached title and release data
3. if missing or stale, fetch RAWG detail data
4. normalize and upsert title metadata plus release/platform data
5. compare previous and new release data
6. create change events when meaningful differences are detected

## Watchlist model

- guests can search and browse
- authenticated users can add/remove titles from watchlist
- watchlist is tracked at the title level
- watchlist entries return the title summary plus platform releases

## Notifications

Current MVP notification event types:
- `release_date_changed`
- `release_approaching`

Notification records are in-app first. Push delivery follows after the in-app pipeline is stable.

## Client auth keys

Web and mobile clients must use only the Supabase project URL and publishable key.
Service role or other secret keys must not be used in client apps.
