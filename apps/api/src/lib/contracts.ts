import type {
  NotificationPreferences,
  NotificationRecord,
  SearchDecisionReason,
  SearchProviderUsedTrigger,
  SearchServedBy,
  TitleDetails,
  TitleSummary,
  WatchlistItem,
} from "@repo/types";

export interface HomeDiscoveryResult {
  upcoming: TitleSummary[];
  latest: TitleSummary[];
  popular: TitleSummary[];
}

export interface HomeDiscoveryPageResult {
  items: TitleSummary[];
  nextCursor: string | null;
}

export interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
  servedBy?: SearchServedBy;
  decisionReason?: SearchDecisionReason;
  providerUsedTrigger?: SearchProviderUsedTrigger;
}

export interface TitleDetailsResult {
  details: TitleDetails;
  isInWatchlist: boolean;
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

export interface NotificationPreferencesResult {
  preferences: NotificationPreferences;
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
