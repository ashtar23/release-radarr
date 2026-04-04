import { useCallback, useEffect } from "react";

import { useRecentSearches } from "./use-recent-searches";
import { useSearchRouteQuery } from "./use-search-route-query";
import { useSearchDebugSettings } from "@/features/settings/providers/search-debug-settings";
import { deriveSearchScreenState } from "../screen-state";
import {
  SEARCH_MIN_QUERY_LENGTH,
  useSearchTitlesInfiniteQuery,
} from "../queries/use-search-titles-infinite-query";

export function useSearchScreen() {
  const { query, setQuery, searchBarRef } = useSearchRouteQuery();
  const { forceRawgRefresh, showSourceBadge } = useSearchDebugSettings();
  const queryState = useSearchTitlesInfiniteQuery(query, {
    forceRefresh: forceRawgRefresh,
  });
  const {
    recentSearches,
    recordRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useRecentSearches();

  useEffect(() => {
    const shouldStoreRecentSearch =
      queryState.showSearchResults && queryState.results.length === 0
        ? queryState.debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH
        : queryState.results.length > 0 &&
          queryState.debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH;

    if (!shouldStoreRecentSearch) {
      return;
    }

    recordRecentSearch(queryState.debouncedQuery);
  }, [
    queryState.debouncedQuery,
    queryState.results.length,
    queryState.showSearchResults,
    recordRecentSearch,
  ]);

  const handleRecentSearchPress = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
    },
    [setQuery],
  );

  const state = deriveSearchScreenState({
    query: queryState.query,
    debouncedQuery: queryState.debouncedQuery,
    recentSearches,
    onRecentSearchPress: handleRecentSearchPress,
    onRemoveRecentSearch: removeRecentSearch,
    onClearRecentSearches: clearRecentSearches,
    showSourceBadge,
    configError: queryState.configError,
    isFetchingInitial: queryState.isFetchingInitial,
    isFetchingAny: queryState.isFetchingAny,
    hasStaleQueryData: queryState.hasStaleQueryData,
    isTypingDifferentQuery: queryState.isTypingDifferentQuery,
    hasInitialError: queryState.hasInitialError,
    initialErrorMessage: queryState.initialErrorMessage,
    showSearchResults: queryState.showSearchResults,
    results: queryState.results,
    servedBy: queryState.servedBy,
    decisionReason: queryState.decisionReason,
    hasMoreResults: queryState.hasMoreResults,
    isLoadingMore: queryState.isLoadingMore,
    loadMoreErrorMessage: queryState.loadMoreErrorMessage,
    loadMoreResults: queryState.loadMoreResults,
  });

  return {
    query,
    searchBarRef,
    setQuery,
    state,
    retry: queryState.refetchSearch,
    retrying: queryState.isFetchingInitial,
    canShowOfflineState: queryState.query.length >= SEARCH_MIN_QUERY_LENGTH,
  };
}
