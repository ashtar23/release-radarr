import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { SearchStateView } from "@/features/search/components/search-state-view";
import { SearchResultsList } from "@/features/search/components/search-results-list";
import { useSearchTitlesQuery } from "@/features/search/hooks/use-search-titles-query";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [resultLimit, setResultLimit] = useState(10);
  const searchState = useSearchTitlesQuery(query, resultLimit);

  const loadMoreResults = () => {
    if (searchState.mode !== "results") return;
    if (!searchState.hasMoreResults || searchState.isLoadingMore) return;
    setResultLimit((currentLimit) => currentLimit + 10);
  };

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
          setResultLimit(10);
        }}
      />

      {searchState.mode === "results" ? (
        <SearchResultsList
          hasMoreResults={searchState.hasMoreResults}
          isLoadingMore={searchState.isLoadingMore}
          results={searchState.results}
          query={searchState.debouncedQuery}
          onEndReached={loadMoreResults}
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
