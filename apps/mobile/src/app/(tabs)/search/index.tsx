import React from "react";
import { Stack } from "expo-router";

import { SearchScreenContent } from "@/features/search/components/search-screen-content";
import { useSearchScreenFeature } from "@/features/search/hooks/use-search-screen-feature";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
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

  return (
    <>
      <Stack.SearchBar
        ref={searchBarRef}
        autoFocus
        hideNavigationBar={false}
        placement="automatic"
        placeholder="Search games..."
        shouldShowHintSearchIcon={false}
        textColor={theme.text}
        headerIconColor={theme.text}
        tintColor={theme.textSecondary}
        hintTextColor={theme.textSecondary}
        onChangeText={(event) => {
          setQuery(event.nativeEvent.text);
        }}
      />

      <SearchScreenContent
        searchState={searchState}
        recentSearches={recentSearches}
        onRecentSearchPress={onRecentSearchPress}
        onRemoveRecentSearch={onRemoveRecentSearch}
        onClearRecentSearches={onClearRecentSearches}
      />
    </>
  );
}
