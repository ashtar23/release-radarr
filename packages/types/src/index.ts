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
  TitlePlatform,
  TitleSearchResult,
  TitleSummary,
} from "./titles";

export type { WatchlistItem } from "./watchlist";
export { authCredentialsSchema } from "./auth";
export type { AuthCredentialsInput } from "./auth";
