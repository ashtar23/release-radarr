import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { SearchStateView } from "@/features/search/components/search-state-view";
import { SearchResultsList } from "@/features/search/components/search-results-list";
import { useSearchDebugSettings } from "@/features/search/debug/search-debug-settings";
import { useSearchTitlesQuery } from "@/features/search/hooks/use-search-titles-query";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const { forceRawgRefresh, showSourceBadge } = useSearchDebugSettings();
  const searchState = useSearchTitlesQuery(query, {
    forceRefresh: forceRawgRefresh,
  });

  return (
    <View style={styles.root}>
      <Stack.SearchBar
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

      {searchState.mode === "results" ? (
        <SearchResultsList
          key={`${searchState.debouncedQuery}:${forceRawgRefresh ? "force" : "cache"}`}
          hasMoreResults={searchState.hasMoreResults}
          isLoadingMore={searchState.isLoadingMore}
          loadMoreErrorMessage={searchState.loadMoreErrorMessage}
          onRetryLoadMore={searchState.loadMoreResults}
          results={searchState.results}
          servedBy={searchState.servedBy}
          decisionReason={searchState.decisionReason}
          showSourceBadge={showSourceBadge}
          onEndReached={searchState.loadMoreResults}
        />
      ) : (
        <SearchStateView
          mode={searchState.mode}
          query={searchState.query}
          errorMessage={searchState.errorMessage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
