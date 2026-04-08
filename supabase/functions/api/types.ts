import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../_shared/database.types.ts";
import type {
  SearchDecisionReason as SearchDecisionReasonLiteral,
  SearchProviderUsedTrigger,
  SearchServedBy,
} from "./contracts/search.ts";

export type AdminClient = SupabaseClient<Database>;
export type TitleInsertRow = Database["public"]["Tables"]["titles"]["Insert"];
export type DbJson = Database["public"]["Tables"]["titles"]["Row"]["platforms"];
export type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];
export type WatchlistInsertRow =
  Database["public"]["Tables"]["watchlists"]["Insert"];
export type NotificationEventInsertRow =
  Database["public"]["Tables"]["notification_events"]["Insert"];
export type NotificationEventRow =
  Database["public"]["Tables"]["notification_events"]["Row"];
export type NotificationPreferencesInsertRow =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];
export type NotificationPreferencesRow =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
export type NotificationRecordInsertRow =
  Database["public"]["Tables"]["notification_records"]["Insert"];
export type NotificationRecordRow =
  Database["public"]["Tables"]["notification_records"]["Row"];
export type WatchlistRow = Database["public"]["Tables"]["watchlists"]["Row"];
export type WatchlistViewRow =
  Database["public"]["Views"]["watchlist_items"]["Row"];

export interface TitlePlatform {
  id: string;
  name: string;
}

export type ReleaseDatePrecision = "day" | "month" | "year" | "unknown";

export interface PlatformRelease {
  platformId: string;
  platformName: string;
  releaseDate: string | null;
  releaseDatePrecision: ReleaseDatePrecision;
}

export interface TitleSummary {
  id: string;
  kind: "game";
  source: "rawg";
  externalId: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  earliestReleaseDate: string | null;
  platforms: TitlePlatform[];
  rawgRating: number | null;
  rawgRatingsCount: number | null;
  rawgMetacritic: number | null;
  rawgAdded: number | null;
  rawgReviewsCount: number | null;
  rawgSuggestionsCount: number | null;
  rawgRatingTop: number | null;
}

export interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  servedBy: SearchServedBy;
  decisionReason?: SearchDecisionReasonLiteral;
  providerUsedTrigger?: SearchProviderUsedTrigger;
}

export interface HomeDiscoveryResult {
  upcoming: TitleSummary[];
  latest: TitleSummary[];
  popular: TitleSummary[];
}

export type SearchDecisionReason = SearchDecisionReasonLiteral;

export interface WatchlistItem {
  id: string;
  title: TitleSummary;
  releases: PlatformRelease[];
  addedAt: string;
}

export interface WatchlistListResult {
  items: WatchlistItem[];
  nextCursor: string | null;
}

export interface WatchlistUpsertResult {
  item: WatchlistItem;
}

export interface WatchlistMembershipResult {
  isInWatchlist: boolean;
}

export type NotificationEventType =
  | "release_date_changed"
  | "release_approaching";

export type NotificationTimingPreset =
  | "on_day"
  | "hours_24_before"
  | "days_7_before"
  | "days_30_before";

export type NotificationDestinationKind = "title";

export interface NotificationChannelPreferences {
  inApp: boolean;
  push: boolean;
}

export interface NotificationEventPreferences {
  releaseDateChanged: boolean;
  releaseApproaching: boolean;
}

export interface NotificationPreferences {
  channels: NotificationChannelPreferences;
  events: NotificationEventPreferences;
  timingPresets: NotificationTimingPreset[];
  updatedAt: string;
}

export interface NotificationPreferencesResult {
  preferences: NotificationPreferences;
}

export interface ReleaseDateChangedNotificationPayload {
  previousReleaseDate: string | null;
  nextReleaseDate: string | null;
}

export interface ReleaseApproachingNotificationPayload {
  targetReleaseDate: string | null;
  timingPreset: NotificationTimingPreset;
}

export type NotificationPayload =
  | ReleaseDateChangedNotificationPayload
  | ReleaseApproachingNotificationPayload;

export interface NotificationRecord {
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

export interface NotificationRecordListResult {
  items: NotificationRecord[];
  nextCursor: string | null;
}

export interface NotificationUnreadCountResult {
  unreadCount: number;
}

export interface MarkNotificationReadResult {
  notification: NotificationRecord;
}

export interface MarkAllNotificationsReadResult {
  markedCount: number;
}

export interface TitleDetails extends TitleSummary {
  description: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  websiteUrl: string | null;
  releases: PlatformRelease[];
}

export interface LocalSearchResult {
  summary: TitleSummary;
  searchUpdatedAt: string;
}

export interface RawgSearchResponse {
  count?: number;
  results?: RawgSearchGame[];
}

export interface RawgSearchPage {
  totalCount: number | null;
  results: TitleSummary[];
}

export interface RawgSearchGame {
  id: number;
  slug: string | null;
  name: string;
  background_image: string | null;
  released: string | null;
  rating?: number | null;
  ratings_count?: number | null;
  metacritic?: number | null;
  added?: number | null;
  reviews_count?: number | null;
  suggestions_count?: number | null;
  rating_top?: number | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
  }>;
}

export interface RawgDetailGame extends RawgSearchGame {
  description_raw?: string | null;
  genres?: Array<{ name?: string }>;
  developers?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  website?: string | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
    released_at?: string | null;
  }>;
}

export interface ApiErrorPayload {
  error: string;
}
