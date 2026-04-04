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
export { getHomeDiscovery, type GetHomeDiscoveryParams } from "./home";
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
  createReleaseRadarApiClient,
  type ReleaseRadarApiClient,
  type ReleaseRadarApiClientOptions,
} from "./release-radar-client";
export {
  initializeSupabaseClient,
  type InitializedSupabaseClient,
  type InitializeSupabaseClientOptions,
} from "./supabase-client";
