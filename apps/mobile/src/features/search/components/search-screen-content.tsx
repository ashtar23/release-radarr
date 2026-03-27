import { SearchResultsList } from "./search-results-list";
import { SearchStateView } from "./search-state-view";
import type { SearchScreenState } from "../hooks/use-search-screen-state";

interface SearchScreenContentProps {
  searchState: SearchScreenState;
}

export function SearchScreenContent({
  searchState,
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

  return (
    <SearchStateView
      mode={searchState.mode}
      query={searchState.query}
      errorMessage={searchState.errorMessage}
    />
  );
}
