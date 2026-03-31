import { RecentSearchesSection } from "./recent-searches-section";
import { SearchResultsList } from "./search-results-list";
import { SearchStateView } from "./search-state-view";
import type { SearchScreenState } from "../hooks/use-search-screen-state";

interface SearchScreenContentProps {
  searchState: SearchScreenState;
  recentSearches: string[];
  onRecentSearchPress: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
}

export function SearchScreenContent({
  searchState,
  recentSearches,
  onRecentSearchPress,
  onRemoveRecentSearch,
  onClearRecentSearches,
}: SearchScreenContentProps) {
  if (searchState.mode === "results") {
    return (
      <SearchResultsList
        searchState={searchState}
        onRetryLoadMore={searchState.loadMoreResults}
        onEndReached={searchState.loadMoreResults}
      />
    );
  }

  if (searchState.mode === "idle" && recentSearches.length > 0) {
    return (
      <RecentSearchesSection
        recentSearches={recentSearches}
        onSearchPress={onRecentSearchPress}
        onRemoveSearch={onRemoveRecentSearch}
        onClearAll={onClearRecentSearches}
      />
    );
  }

  return (
    <SearchStateView
      mode={searchState.mode}
      query={searchState.query}
      errorMessage={searchState.errorMessage}
    />
  );
}
