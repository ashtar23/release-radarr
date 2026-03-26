# Frontend API Contract Reference

This is the frontend-facing contract for the Supabase Edge Function API.

## Base URL
- Production: `https://<project-ref>.supabase.co/functions/v1/api`
- Local: `http://127.0.0.1:54321/functions/v1/api`

Path prefix constant:
- `API_PATH_PREFIX = "/functions/v1/api"`

## Auth Model
- Public title endpoints do not require user auth.
- Watchlist endpoints require a valid user bearer token.
- Requests should include:
  - `apikey: <supabase publishable key>`
  - `Authorization: Bearer <access token>`

The shared API client handles this header strategy.

## Response/Error Shape
- Success: JSON payload per endpoint contract.
- Error: `{ "error": string }`
- Common statuses:
  - `400` invalid request input
  - `401` missing/invalid auth (watchlist only)
  - `404` not found
  - `405` method not allowed
  - `500` server error

## Endpoint Catalog

### 1) Search Titles
- Method: `GET`
- Path: `/titles`
- Query:
  - `query` (required, minimum 2 chars)
  - `page` (optional, default 1, minimum 1)
  - `limit` (optional, default 20, clamped to max 25)
  - `forceRefresh` (optional `1|true|yes`)
- Auth: optional
- Returns: `TitleSearchResult`

Example:
```http
GET /functions/v1/api/titles?query=elden&page=1&limit=20
```

Type:
```ts
interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  servedBy?: "local-cache" | "rawg-refresh";
  decisionReason?: string;
  providerUsedTrigger?: string;
}
```

### 2) Get Title Details
- Method: `GET`
- Path: `/titles/{id}` (URL-encoded)
- Auth: optional
- Returns: `TitleDetails`

Example:
```http
GET /functions/v1/api/titles/rawg%3A3498
```

Type:
```ts
interface TitleDetails extends TitleSummary {
  description: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  websiteUrl: string | null;
  releases: PlatformRelease[];
}
```

### 3) List Watchlist
- Method: `GET`
- Path: `/watchlist`
- Auth: required
- Returns: `WatchlistListResult`

Example:
```http
GET /functions/v1/api/watchlist
Authorization: Bearer <access_token>
```

Type:
```ts
interface WatchlistListResult {
  items: WatchlistItem[];
}
```

### 4) Add Watchlist Item
- Method: `POST`
- Path: `/watchlist`
- Auth: required
- Body:
```json
{ "titleId": "rawg:3498" }
```
- Returns: `WatchlistUpsertResult` (`201`)

Type:
```ts
interface WatchlistUpsertResult {
  item: WatchlistItem;
}
```

Notes:
- `titleId` is required and trimmed.
- Returns `404` if the title does not exist in the titles table.

### 5) Remove Watchlist Item
- Method: `DELETE`
- Path: `/watchlist/{titleId}` (URL-encoded)
- Auth: required
- Returns: `200` with `{ "removed": true }`

Example:
```http
DELETE /functions/v1/api/watchlist/rawg%3A3498
Authorization: Bearer <access_token>
```

Notes:
- Safe to treat as idempotent on FE.
- The shared API client exposes this as `Promise<void>`.

## Official Typed Client Surface (`@repo/api-client`)

```ts
interface ReleaseRadarApiClient {
  searchTitles(params: { query: string; page?: number; limit?: number; forceRefresh?: boolean; signal?: AbortSignal }): Promise<TitleSearchResult>;
  getTitleDetails(params: { id: string; signal?: AbortSignal }): Promise<TitleDetails>;
  listWatchlist(params?: { signal?: AbortSignal }): Promise<WatchlistListResult>;
  addWatchlistItem(params: { titleId: string; signal?: AbortSignal }): Promise<WatchlistUpsertResult>;
  removeWatchlistItem(params: { titleId: string; signal?: AbortSignal }): Promise<void>;
}
```

Important:
- `health()` exists in the interface but is not implemented yet (throws).

## FE Usage Example

```ts
import { createReleaseRadarApiClient } from "@repo/api-client";

const api = createReleaseRadarApiClient({
  baseUrl: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});

const search = await api.searchTitles({ query: "hades", limit: 10 });
const detail = await api.getTitleDetails({ id: search.results[0].id });
await api.addWatchlistItem({ titleId: detail.id });
const watchlist = await api.listWatchlist();
await api.removeWatchlistItem({ titleId: detail.id });
```

## Error Handling Contract

`@repo/api-client` throws `ApiClientError` for non-2xx responses:

```ts
class ApiClientError extends Error {
  status: number;
  method: "GET" | "POST" | "DELETE";
  path: string;
}
```

Recommended FE handling:
- `401`: prompt sign-in / refresh auth state
- `400`: show validation message
- `404`: show not-found state
- `>=500`: show retryable error toast/banner
