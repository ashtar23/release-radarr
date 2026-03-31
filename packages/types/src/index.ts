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
  NotificationChannelPreferences,
  NotificationEventPreferences,
  NotificationEventType,
  NotificationPreferences,
  NotificationTimingPreset,
} from "./notifications";
export type { HomeDiscoveryResult } from "./home";

export type {
  PlatformRelease,
  ReleaseDatePrecision,
  SearchDecisionReason,
  TitleDetails,
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
  RemoveWatchlistItemInput,
  WatchlistSort,
  WatchlistItem,
  WatchlistListResult,
  WatchlistUpsertResult,
} from "./watchlist";
export { watchlistSortValues } from "./watchlist";
export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
export { signInCredentialsSchema } from "./auth";
export type { SignInCredentialsInput } from "./auth";
