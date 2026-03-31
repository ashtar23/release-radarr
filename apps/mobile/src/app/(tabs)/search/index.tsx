import React from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { SearchScreenContent } from "@/features/search/components/search-screen-content";
import { useSearchRouteQuery } from "@/features/search/hooks/use-search-route-query";
import { useSearchScreenState } from "@/features/search/hooks/use-search-screen-state";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
  const theme = useTheme();
  const { query, setQuery, searchBarRef } = useSearchRouteQuery();
  const searchState = useSearchScreenState(query);

  return (
    <View style={styles.root}>
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

      <SearchScreenContent searchState={searchState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
