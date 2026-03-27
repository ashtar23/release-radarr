import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";

import { SearchScreenContent } from "@/features/search/components/search-screen-content";
import { useSearchScreenState } from "@/features/search/hooks/use-search-screen-state";
import { useTheme } from "@/hooks/use-theme";

export default function SearchTabScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const searchState = useSearchScreenState(query);

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

      <SearchScreenContent searchState={searchState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
