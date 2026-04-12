# Supabase + Search Architecture

Historical note: this document describes the older Supabase-hosted app-route
architecture and is no longer the current request path for clients. Keep it
only as migration history/reference.

## Supabase setup

Soonr uses a Supabase-first backend with one public edge namespace:
- `/functions/v1/api/titles`
- `/functions/v1/api/titles/:id`
- `/functions/v1/api/watchlist`

The main tables in play are:
- `public.titles` for cached title metadata
- `public.watchlists` for per-user saved titles

The `titles` table is optimized for search with:
- deduplicated RAWG upserts on `(source, external_id)`
- freshness timestamps for search and detail data
- search indexes on name lookups

The `watchlists` table is protected by RLS and keyed by `(user_id, title_id)`.

## Frontend connection

Both apps use `@repo/api-client` only.

Request flow:
1. app creates the shared client with Supabase URL, publishable key, and optional access token getter
2. `@repo/api-client` sends requests to `/functions/v1/api/*`
3. the request layer adds `apikey` plus bearer auth when needed
4. payload guards validate the response before it reaches UI code

## Search flow

Search is DB-first, then RAWG fallback.

1. client sends `query`, `page`, `limit`, and optional `forceRefresh`
2. backend queries local `titles` first using normalized `search_name`,
   substring matching, and trigram similarity
3. backend ranks the local candidate pool into the page the user actually sees
4. if the first local page is weak or stale, backend fetches RAWG, normalizes
   the results, and upserts them into `titles`
5. response includes `page`, `limit`, `totalCount`, `hasMore`, `servedBy`, and decision metadata

This lets the mobile app drive infinite scroll without guessing whether more data exists.

## Pagination note

Search currently uses page-based pagination, not cursor pagination.

That is intentional because the backend search pipeline is a ranked result flow that can combine:
- local cached titles
- search policy decisions
- optional RAWG refresh and cache fill

Future cursor pagination is allowed, but only as a backend-first change. It should not be introduced from the mobile client outward.

Before adopting cursor search, the backend must define:
- a stable ranked ordering contract
- stable tie-breakers
- an opaque continuation cursor
- consistent continuation behavior across local-only and RAWG-refresh result paths

Until then, page + limit remains the source-of-truth contract for search.

## Data update paths

### Search cache fill
When RAWG search succeeds, normalized summaries are upserted into `public.titles`.

### Detail refresh
`GET /titles/:id` serves the cached detail when fresh, otherwise fetches RAWG detail data, normalizes it, and updates the cache. Meaningful release changes can create change events.

### Watchlist writes
`POST /watchlist` validates the title exists, inserts or updates the user/title pair, and returns the saved item.
`DELETE /watchlist/:titleId` removes the row for the current user.

## Failure behavior

- search query shorter than 2 characters: `400`
- missing RAWG key or RAWG failure: return local search/detail data when available
- unknown watchlist title: `404`
- invalid or missing watchlist auth: `401`
- failed upsert after a successful RAWG fetch: `500`

```ts
const { data } = await client
  .from("titles")
  .select("...")
  .ilike("name", `%${query}%`)
  .order("search_updated_at", { ascending: false })
  .limit(limit);

await client.from("titles").upsert(rows, {
  onConflict: "source,external_id",
});
```

### `supabase/functions/api/providers/rawg.ts`

```ts
const searchUrl = new URL(RAWG_BASE_URL);
searchUrl.searchParams.set("key", rawgApiKey);
searchUrl.searchParams.set("search", query);
searchUrl.searchParams.set("page_size", String(limit));

const response = await fetch(searchUrl);
if (!response.ok) throw new Error(...);

const payload = (await response.json()) as RawgSearchResponse;
return (payload.results ?? []).map(mapRawgSearchGameToSummary);
```

### `packages/api-client/src/soonr-client.ts`

```ts
export function createSoonrApiClient(options: SoonrApiClientOptions) {
  const context = {
    baseUrl: options.baseUrl,
    publishableKey: options.publishableKey,
    getAccessToken: options.getAccessToken,
    fetchFn: options.fetchFn ?? fetch,
  };

  return {
    searchTitles: (params) => searchTitles({ context, params }),
    getTitleDetails: (params) => getTitleDetails({ context, params }),
    listWatchlist: (params = {}) => listWatchlist({ context, params }),
    addWatchlistItem: (params) => addWatchlistItem({ context, params }),
    removeWatchlistItem: (params) =>
      removeWatchlistItem({ context, params }),
  };
}
```
