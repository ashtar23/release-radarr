import { useCallback, useEffect } from "react";

import { useRecentSearches } from "@/features/search/hooks/use-recent-searches";
import { useSearchRouteQuery } from "@/features/search/hooks/use-search-route-query";
import { useSearchScreenState } from "@/features/search/hooks/use-search-screen-state";
import { SEARCH_MIN_QUERY_LENGTH } from "@/features/search/hooks/use-search-titles-infinite-query";

export function useSearchScreenFeature() {
  const { query, setQuery, searchBarRef } = useSearchRouteQuery();
  const searchState = useSearchScreenState(query);
  const {
    recentSearches,
    recordRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useRecentSearches();

  useEffect(() => {
    const shouldStoreRecentSearch =
      (searchState.mode === "results" || searchState.mode === "empty") &&
      searchState.debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH;

    if (!shouldStoreRecentSearch) {
      return;
    }

    recordRecentSearch(searchState.debouncedQuery);
  }, [recordRecentSearch, searchState.debouncedQuery, searchState.mode]);

  const handleRecentSearchPress = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
      searchBarRef.current?.setText(recentQuery);
    },
    [setQuery, searchBarRef],
  );

  return {
    query,
    setQuery,
    searchBarRef,
    searchState,
    recentSearches,
    onRecentSearchPress: handleRecentSearchPress,
    onRemoveRecentSearch: removeRecentSearch,
    onClearRecentSearches: clearRecentSearches,
  };
}
