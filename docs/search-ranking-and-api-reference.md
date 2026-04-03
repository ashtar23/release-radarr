# Search Ranking + API Reference

This is the current-state reference for the search contract, ranking behavior, and client integration.

## API surface

The edge function routes are:
- `GET /api/titles`
- `GET /api/titles/:id`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:titleId`

Public title routes are unauthenticated. Watchlist routes require a bearer token validated through Supabase Auth.

## Search contract

Request:
- `query` required, minimum 2 characters
- `page` optional, default 1
- `limit` optional, default 20, max 25
- `forceRefresh` optional to force the provider path

Response:
- `query`
- `results`
- `totalCount`
- `page`
- `limit`
- `hasMore`
- `servedBy`
- `decisionReason`
- `providerUsedTrigger`

The shared client mirrors that contract and `useSearchTitlesQuery` uses `useInfiniteQuery` with a fixed page size.

## Pagination stance

Search is intentionally page-based today.

- current request contract: `query`, `page`, `limit`, optional `forceRefresh`
- current response contract: `page`, `limit`, `hasMore`
- mobile uses `useInfiniteQuery`, but computes the next page from `lastPage.page + 1`

This is different from notifications, which are cursor-based and return `nextCursor`.

That difference is intentional:
- notifications are a chronological feed, which is a natural fit for cursor pagination
- search is currently a ranked result set backed by local DB search plus optional RAWG refresh, which is implemented end-to-end as page + limit

### Guidance for future AI work

Treat search as a first-class performance feature. It should be one of the highest-optimization surfaces in the app.

However, do not change search to cursor pagination only to make it look like notifications on the client.

Cursor search should be considered only if the backend contract is redesigned to support it safely:
- stable deterministic sort order for ranked search results
- stable tie-breakers across pages
- an opaque cursor that can represent continuation state for the ranked result set
- parity across local-cache and RAWG-refresh paths

Until that backend work exists, frontend search should keep:
- page + limit request semantics
- `useInfiniteQuery` on the client
- a delegated `queryFn` shape similar to notifications where possible
- careful handling of stale typed queries, deduped pages, and load-more state

The goal is not identical pagination mechanics across features. The goal is the best scalable search UX for the contract we actually have.

## Search flow

1. normalize the query and decide whether it is broad or specific
2. fetch the local page from `titles`
3. rank and merge local candidates using the current search scoring rules
4. if the page is weak or stale, fetch RAWG, normalize the result set, and upsert it into the cache
5. return the ranked page plus pagination metadata

The important behavior is that search is DB-first, but the user always gets a ranked page, not raw provider output.

## Ranking behavior

Ranking lives in `supabase/functions/api/handlers/search.ts` and is built from:
- lexical matching and token coverage
- broad vs specific intent
- platform relevance
- metadata quality and provider popularity signals
- tie-breakers on score, then name, then id

Specific queries can stop early when strong matches are exhausted, which keeps later pages from filling with low-relevance noise.

## Client integration

`packages/api-client` is the only frontend API layer.

- `searchTitles` accepts `query`, `page`, `limit`, `forceRefresh`, and `signal`
- the mobile hook dedupes combined pages and hides stale query flashes during transitions
- watchlist and title details reuse the same client and the same auth header strategy

## Code references

- Search handler and ranking: `supabase/functions/api/handlers/search.ts`
- Search policy helpers: `supabase/functions/api/utils/search-fallback-policy.ts`
- Search freshness helpers: `supabase/functions/api/utils/search-freshness-window.ts`
- Search provider policy: `supabase/functions/api/utils/search-provider-policy.ts`
- Shared search contract: `packages/types/src/titles.ts`
- Search client: `packages/api-client/src/search.ts`
- Mobile search query hook: `apps/mobile/src/features/search/queries/use-search-titles-infinite-query.ts`
- Mobile search screen hook: `apps/mobile/src/features/search/hooks/use-search-screen.ts`
