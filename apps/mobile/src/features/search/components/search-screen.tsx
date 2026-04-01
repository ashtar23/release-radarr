import React from "react";
import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

import { RecentSearchesSection } from "./recent-searches-section";
import { SearchResultsList } from "./search-results-list";
import { SearchStateView } from "./search-state-view";
import { useSearchScreenFeature } from "../hooks/use-search-screen-feature";

export function SearchScreen() {
  const theme = useTheme();
  const {
    setQuery,
    searchBarRef,
    searchState,
    recentSearches,
    onRecentSearchPress,
    onRemoveRecentSearch,
    onClearRecentSearches,
  } = useSearchScreenFeature();

  if (searchState.mode === "results") {
    return (
      <>
        <SearchHeader
          searchBarRef={searchBarRef}
          textColor={theme.text}
          secondaryTextColor={theme.textSecondary}
          onChangeText={setQuery}
        />
        <SearchResultsList
          searchState={searchState}
          onRetryLoadMore={searchState.loadMoreResults}
          onEndReached={searchState.loadMoreResults}
        />
      </>
    );
  }

  if (searchState.mode === "idle" && recentSearches.length > 0) {
    return (
      <>
        <SearchHeader
          searchBarRef={searchBarRef}
          textColor={theme.text}
          secondaryTextColor={theme.textSecondary}
          onChangeText={setQuery}
        />
        <RecentSearchesSection
          recentSearches={recentSearches}
          onSearchPress={onRecentSearchPress}
          onRemoveSearch={onRemoveRecentSearch}
          onClearAll={onClearRecentSearches}
        />
      </>
    );
  }

  return (
    <>
      <SearchHeader
        searchBarRef={searchBarRef}
        textColor={theme.text}
        secondaryTextColor={theme.textSecondary}
        onChangeText={setQuery}
      />
      <SearchStateView
        mode={searchState.mode}
        query={searchState.query}
        errorMessage={searchState.errorMessage}
      />
    </>
  );
}

function SearchHeader({
  searchBarRef,
  textColor,
  secondaryTextColor,
  onChangeText,
}: {
  searchBarRef: React.RefObject<{
    setText: (text: string) => void;
    clearText: () => void;
    focus: () => void;
    blur: () => void;
    toggleCancelButton: (flag: boolean) => void;
    cancelSearch: () => void;
  } | null>;
  textColor: string;
  secondaryTextColor: string;
  onChangeText: (query: string) => void;
}) {
  return (
    <Stack.SearchBar
      ref={searchBarRef}
      autoFocus
      hideNavigationBar={false}
      placement="automatic"
      placeholder="Search games..."
      shouldShowHintSearchIcon={false}
      textColor={textColor}
      headerIconColor={textColor}
      tintColor={secondaryTextColor}
      hintTextColor={secondaryTextColor}
      onChangeText={(event) => {
        onChangeText(event.nativeEvent.text);
      }}
    />
  );
}
