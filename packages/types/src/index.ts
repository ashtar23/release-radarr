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
  MarkNotificationReadInput,
  NotificationChannelPreferences,
  NotificationDestinationKind,
  NotificationEventPreferences,
  NotificationEventType,
  NotificationPreferences,
  NotificationRecord,
  NotificationTimingPreset,
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
export type {
  PlatformRelease,
  ReleaseDatePrecision,
  SearchDecisionReason,
  TitleDetails,
  TitleSearchQueryInput,
  TitlePlatform,
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
} from "./watchlist";
export { watchlistSortValues } from "./watchlist";
export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
export { signInCredentialsSchema } from "./auth";
export type { SignInCredentialsInput } from "./auth";
