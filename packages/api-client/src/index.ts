export {
  ApiClientError,
  getApiErrorMessage,
  isApiClientError,
  type ApiClientErrorOptions,
  type HttpMethod,
} from "./errors";
export {
  buildAuthHeaders,
  resolveAccessToken,
  type AccessTokenProvider,
} from "./auth";
export { type RequestContext, requestJson, requestVoid } from "./request";
export {
  type EmailAvailabilityResponse,
  type HealthStatusResponse,
  type HomeDiscoveryLatestPageResponse,
  type HomeDiscoveryPopularPageResponse,
  type HomeDiscoveryResponse,
  type HomeDiscoveryUpcomingPageResponse,
  type MarkAllNotificationsReadResponse,
  type MarkNotificationReadResponse,
  type NotificationPreferencesResponse,
  type NotificationRecordListResponse,
  type NotificationUnreadCountResponse,
  type TitleDetailsResponse,
  type TitleSearchResponse,
  type WatchlistListResponse,
  type WatchlistMembershipResponse,
  type WatchlistUpsertResponse,
} from "./openapi-types";
export {
  getHomeDiscovery,
  listHomeDiscoveryLatestPage,
  listHomeDiscoveryPopularPage,
  listHomeDiscoveryUpcomingPage,
  type GetHomeDiscoveryParams,
  type ListHomeDiscoveryPageParams,
} from "./home";
export {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type ListNotificationsParams,
  type MarkAllNotificationsReadParams,
  type MarkNotificationReadParams,
  type UpdateNotificationPreferencesParams,
} from "./notifications";
export { getTitleDetails, type GetTitleDetailsParams } from "./titles";
export { searchTitles, type SearchTitlesParams } from "./search";
export {
  addWatchlistItem,
  getWatchlistMembership,
  listWatchlist,
  removeWatchlistItem,
  type AddWatchlistItemParams,
  type GetWatchlistMembershipParams,
  type ListWatchlistParams,
  type RemoveWatchlistItemParams,
} from "./watchlist";
export {
  createSoonrApiClient,
  type SoonrApiClient,
  type SoonrApiClientOptions,
} from "./soonr-client";
export {
  initializeSupabaseClient,
  type InitializedSupabaseClient,
  type InitializeSupabaseClientOptions,
} from "./supabase-client";
