import { SEARCH_MIN_QUERY_LENGTH } from "../queries/use-search-titles-infinite-query";

import type {
  SearchScreenReadyState,
  SearchScreenState,
} from "./types";

type DeriveSearchScreenStateInput = {
  query: string;
  debouncedQuery: string;
  recentSearches: string[];
  onRecentSearchPress: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  showSourceBadge: boolean;
  configError: string | null;
  isFetchingInitial: boolean;
  isFetchingAny: boolean;
  hasStaleQueryData: boolean;
  isTypingDifferentQuery: boolean;
  hasInitialError: boolean;
  initialErrorMessage: string | null;
  showSearchResults: boolean;
  results: SearchScreenReadyState["results"];
  servedBy: SearchScreenReadyState["servedBy"];
  decisionReason: SearchScreenReadyState["decisionReason"];
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMoreResults: () => void;
};

export function deriveSearchScreenState({
  query,
  debouncedQuery,
  recentSearches,
  onRecentSearchPress,
  onRemoveRecentSearch,
  onClearRecentSearches,
  showSourceBadge,
  configError,
  isFetchingInitial,
  isFetchingAny,
  hasStaleQueryData,
  isTypingDifferentQuery,
  hasInitialError,
  initialErrorMessage,
  showSearchResults,
  results,
  servedBy,
  decisionReason,
  hasMoreResults,
  isLoadingMore,
  loadMoreErrorMessage,
  loadMoreResults,
}: DeriveSearchScreenStateInput): SearchScreenState {
  if (query.length === 0) {
    return {
      mode: "idle",
      query,
      recentSearches,
      onRecentSearchPress,
      onRemoveRecentSearch,
      onClearRecentSearches,
    };
  }

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return {
      mode: "typing-too-short",
      query,
    };
  }

  if (configError) {
    return {
      mode: "request-error",
      query,
      errorMessage: configError,
    };
  }

  if (isFetchingInitial) {
    return {
      mode: "loading",
      query,
    };
  }

  if (isTypingDifferentQuery || (isFetchingAny && hasStaleQueryData)) {
    return {
      mode: "loading",
      query,
    };
  }

  if (hasInitialError) {
    return {
      mode: "request-error",
      query,
      errorMessage: initialErrorMessage,
    };
  }

  if (!showSearchResults || results.length === 0) {
    return {
      mode: "empty",
      query: debouncedQuery,
    };
  }

  return {
    mode: "ready",
    results,
    servedBy,
    decisionReason,
    showSourceBadge,
    hasMoreResults,
    isLoadingMore,
    loadMoreErrorMessage,
    loadMoreResults,
  };
}
