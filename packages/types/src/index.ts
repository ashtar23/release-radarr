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

export type {
  PlatformRelease,
  ReleaseDatePrecision,
  TitleDetails,
  TitleSearchQueryInput,
  TitlePlatform,
  TitleSearchResult,
  TitleSummary,
} from "./titles";
export { titleSearchQuerySchema } from "./titles";

export type {
  AddWatchlistItemInput,
  RemoveWatchlistItemInput,
  WatchlistItem,
  WatchlistListResult,
  WatchlistUpsertResult,
} from "./watchlist";
export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
