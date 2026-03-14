import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import {
  SearchStateView,
} from "@/features/search/components/search-state-view";
import { SearchResultsList } from "@/features/search/components/search-results-list";
import { useSearchTitlesQuery } from "@/features/search/hooks/use-search-titles-query";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const searchState = useSearchTitlesQuery(query);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: "Search" }} />
      <Stack.SearchBar
        autoFocus
        hideNavigationBar={false}
        placement="automatic"
        placeholder="Search games..."
        onChangeText={(event) => {
          setQuery(event.nativeEvent.text);
        }}
      />
      {searchState.mode === "results" ? (
        <SearchResultsList results={searchState.results} />
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
