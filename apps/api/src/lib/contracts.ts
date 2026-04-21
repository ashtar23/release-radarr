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

export interface UsernameAvailabilityResult {
  available: boolean;
  reason?: "taken" | "invalid" | "reserved";
}

export interface EmailAvailabilityResult {
  available: boolean;
  reason?: "taken";
}

export interface SignUpResult {
  userId: string;
  email: string;
  username: string;
  displayName: string | null;
  nextStep: "sign-in";
}

export interface SocialFollowingMutationResult {
  following: boolean;
  isFriend: boolean;
}

export interface ProfileRelationshipResult {
  following: boolean;
  followedByViewer: boolean;
  isFriend: boolean;
}

export interface ProfileWatchlistPreviewItemResult {
  id: string;
  titleId: string;
  name: string;
  addedAt: string;
}

export interface ProfileOverviewResult {
  profile: {
    userId: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    watchlistVisibility: "private" | "friends" | "public";
  };
  relationship: ProfileRelationshipResult;
  counts: {
    followers: number;
    following: number;
    friends: number;
  };
  canViewWatchlist: boolean;
  watchlistPreview: ProfileWatchlistPreviewItemResult[];
  recentAdditionsPreview: ProfileWatchlistPreviewItemResult[];
}

export interface ProfileConnectionSummaryResult {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  relationship: ProfileRelationshipResult;
}

export interface ProfileConnectionsListResult {
  items: ProfileConnectionSummaryResult[];
  nextCursor: string | null;
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
