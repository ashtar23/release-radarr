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
- Mobile search hook: `apps/mobile/src/features/search/hooks/use-search-titles-query.ts`
