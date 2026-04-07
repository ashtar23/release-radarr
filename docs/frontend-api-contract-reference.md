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
- Notifications endpoints require a valid user bearer token.
- Requests should include:
  - `apikey: <supabase publishable key>`
  - `Authorization: Bearer <access token>`

The shared API client handles this header strategy.

## Response/Error Shape

- Success: JSON payload per endpoint contract.
- Error: `{ "error": string }`
- Common statuses:
  - `400` invalid request input
  - `401` missing/invalid auth (watchlist/notifications)
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

### 6) List Notifications

- Method: `GET`
- Path: `/notifications`
- Auth: required
- Query:
  - `cursor` (optional opaque pagination cursor)
  - `limit` (optional, default 20, clamped to max 50)
- Returns: `NotificationRecordListResult`

Example:

```http
GET /functions/v1/api/notifications?limit=20
Authorization: Bearer <access_token>
```

Type:

```ts
interface NotificationRecordListResult {
  items: NotificationRecord[];
  nextCursor: string | null;
}
```

Sorting:

- newest first
- backend order is `createdAt DESC, id DESC`

### 7) Get Notification Unread Count

- Method: `GET`
- Path: `/notifications/unread-count`
- Auth: required
- Returns: `NotificationUnreadCountResult`

Example:

```http
GET /functions/v1/api/notifications/unread-count
Authorization: Bearer <access_token>
```

Type:

```ts
interface NotificationUnreadCountResult {
  unreadCount: number;
}
```

### 8) Mark Notification Read

- Method: `POST`
- Path: `/notifications/{notificationId}/read` (URL-encoded)
- Auth: required
- Returns: `MarkNotificationReadResult`

Example:

```http
POST /functions/v1/api/notifications/notification-record%3Aevent%3A123%3Auser%3A456/read
Authorization: Bearer <access_token>
```

Type:

```ts
interface MarkNotificationReadResult {
  notification: NotificationRecord;
}
```

Notes:

- idempotent for FE use
- returns `404` if the notification is not owned by the caller or does not exist

### 9) Mark All Notifications Read

- Method: `POST`
- Path: `/notifications/read-all`
- Auth: required
- Returns: `MarkAllNotificationsReadResult`

Example:

```http
POST /functions/v1/api/notifications/read-all
Authorization: Bearer <access_token>
```

Type:

```ts
interface MarkAllNotificationsReadResult {
  markedCount: number;
}
```

Notes:

- idempotent for FE use
- `markedCount` is the number of unread records updated in this request

### 10) Get Notification Preferences

- Method: `GET`
- Path: `/notification-preferences`
- Auth: required
- Returns: `NotificationPreferencesResult`

Example:

```http
GET /functions/v1/api/notification-preferences
Authorization: Bearer <access_token>
```

Type:

```ts
interface NotificationPreferencesResult {
  preferences: NotificationPreferences;
}
```

Notes:

- if no row exists yet, backend returns default preferences instead of `404`

### 11) Update Notification Preferences

- Method: `PUT`
- Path: `/notification-preferences`
- Auth: required
- Body:

```json
{
  "channels": { "inApp": true, "push": false },
  "events": {
    "releaseDateChanged": true,
    "releaseApproaching": true
  },
  "timingPresets": ["on_day", "days_7_before"]
}
```

- Returns: `NotificationPreferencesResult`

Notes:

- upsert semantics by `user_id`
- invalid payload returns `400`

## Official Typed Client Surface (`@repo/api-client`)

```ts
interface SoonrApiClient {
  searchTitles(params: {
    query: string;
    page?: number;
    limit?: number;
    forceRefresh?: boolean;
    signal?: AbortSignal;
  }): Promise<TitleSearchResult>;
  getTitleDetails(params: {
    id: string;
    signal?: AbortSignal;
  }): Promise<TitleDetails>;
  listNotifications(params?: {
    cursor?: string;
    limit?: number;
    signal?: AbortSignal;
  }): Promise<NotificationRecordListResult>;
  getNotificationUnreadCount(): Promise<NotificationUnreadCountResult>;
  markAllNotificationsRead(params?: {
    signal?: AbortSignal;
  }): Promise<MarkAllNotificationsReadResult>;
  markNotificationRead(params: {
    notificationId: string;
    signal?: AbortSignal;
  }): Promise<MarkNotificationReadResult>;
  getNotificationPreferences(): Promise<NotificationPreferencesResult>;
  updateNotificationPreferences(params: {
    channels: { inApp: boolean; push: boolean };
    events: { releaseDateChanged: boolean; releaseApproaching: boolean };
    timingPresets: NotificationTimingPreset[];
    signal?: AbortSignal;
  }): Promise<NotificationPreferencesResult>;
  listWatchlist(params?: {
    signal?: AbortSignal;
  }): Promise<WatchlistListResult>;
  addWatchlistItem(params: {
    titleId: string;
    signal?: AbortSignal;
  }): Promise<WatchlistUpsertResult>;
  removeWatchlistItem(params: {
    titleId: string;
    signal?: AbortSignal;
  }): Promise<void>;
}
```

Supporting notification types:

```ts
type NotificationEventType = "release_date_changed" | "release_approaching";

type NotificationDestinationKind = "title";

type NotificationTimingPreset =
  | "on_day"
  | "hours_24_before"
  | "days_7_before"
  | "days_30_before";

type NotificationPayload =
  | {
      previousReleaseDate: string | null;
      nextReleaseDate: string | null;
    }
  | {
      targetReleaseDate: string | null;
      timingPreset: NotificationTimingPreset;
    };

interface NotificationRecord {
  id: string;
  titleId: string;
  eventType: NotificationEventType;
  destinationKind: NotificationDestinationKind;
  destinationTitleId: string;
  titleName: string;
  titleArtworkUrl: string | null;
  message: string;
  subtitle: string | null;
  payload: NotificationPayload;
  createdAt: string;
  readAt: string | null;
}

interface NotificationPreferences {
  channels: {
    inApp: boolean;
    push: boolean;
  };
  events: {
    releaseDateChanged: boolean;
    releaseApproaching: boolean;
  };
  timingPresets: NotificationTimingPreset[];
  updatedAt: string;
}
```

Important:

- `health()` exists in the interface but is not implemented yet (throws).

## FE Usage Example

```ts
import { createSoonrApiClient } from "@repo/api-client";

const api = createSoonrApiClient({
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
const notifications = await api.listNotifications({ limit: 20 });
const unread = await api.getNotificationUnreadCount();
if (notifications.items[0]) {
  await api.markNotificationRead({ notificationId: notifications.items[0].id });
}
const preferences = await api.getNotificationPreferences();
await api.updateNotificationPreferences({
  channels: preferences.preferences.channels,
  events: preferences.preferences.events,
  timingPresets: preferences.preferences.timingPresets,
});
await api.removeWatchlistItem({ titleId: detail.id });
```

## Error Handling Contract

`@repo/api-client` throws `ApiClientError` for non-2xx responses:

```ts
class ApiClientError extends Error {
  status: number;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
}
```

Recommended FE handling:

- `401`: prompt sign-in / refresh auth state
- `400`: show validation message
- `404`: show not-found state
- `>=500`: show retryable error toast/banner
