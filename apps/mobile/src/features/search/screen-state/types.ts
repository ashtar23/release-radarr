import type { TitleSearchResult, TitleSummary } from "@repo/types";

export type SearchScreenReadyState = {
  mode: "ready";
  results: TitleSummary[];
  servedBy: TitleSearchResult["servedBy"] | null;
  decisionReason: TitleSearchResult["decisionReason"] | null;
  showSourceBadge: boolean;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMoreResults: () => void;
};

export type SearchScreenNonReadyState =
  | {
      mode: "idle";
      query: string;
      recentSearches: string[];
      onRecentSearchPress: (query: string) => void;
      onRemoveRecentSearch: (query: string) => void;
      onClearRecentSearches: () => void;
    }
  | { mode: "typing-too-short"; query: string }
  | { mode: "loading"; query: string }
  | {
      mode: "request-error";
      query: string;
      errorMessage: string | null;
    }
  | { mode: "empty"; query: string };

export type SearchScreenState =
  | SearchScreenNonReadyState
  | SearchScreenReadyState;
