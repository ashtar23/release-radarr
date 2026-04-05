export type {
  ContentKind,
  EntityId,
  ExternalId,
  HealthStatus,
  IsoDateString,
  IsoDateTimeString,
  SourceProvider,
} from "./core";

export type {
  ListNotificationsInput,
  MarkAllNotificationsReadResult,
  MarkNotificationReadInput,
  MarkNotificationReadResult,
  NotificationChannelPreferences,
  NotificationDestinationKind,
  NotificationEventPreferences,
  NotificationEventType,
  NotificationPreferences,
  NotificationPreferencesResult,
  NotificationRecord,
  NotificationRecordListResult,
  NotificationTimingPreset,
  NotificationUnreadCountResult,
  NotificationPayload,
  ReleaseApproachingNotificationPayload,
  ReleaseDateChangedNotificationPayload,
  UpdateNotificationPreferencesInput,
} from "./notifications";
export {
  notificationDestinationKindValues,
  notificationEventTypeValues,
  notificationTimingPresetValues,
} from "./notifications";
export type { HomeDiscoveryResult } from "./home";

export type {
  PlatformRelease,
  ReleaseDatePrecision,
  SearchDecisionReason,
  TitleDetails,
  TitleDetailsResult,
  TitleSearchQueryInput,
  TitlePlatform,
  TitleSearchResult,
  TitleSummary,
} from "./titles";
export { titleSearchQuerySchema } from "./titles";
export type {
  SearchIntentMode,
  SearchProviderUsedTrigger,
  SearchServedBy,
} from "./search-contract";
export {
  searchDecisionReasonValues,
  searchIntentModeValues,
  searchProviderUsedTriggerValues,
  searchServedByValues,
} from "./search-contract";

export type {
  AddWatchlistItemInput,
  ListWatchlistInput,
  RemoveWatchlistItemInput,
  WatchlistSort,
  WatchlistItem,
  WatchlistListResult,
  WatchlistMembershipResult,
  WatchlistUpsertResult,
} from "./watchlist";
export { watchlistSortValues } from "./watchlist";
export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
export { signInCredentialsSchema } from "./auth";
export type { SignInCredentialsInput } from "./auth";
