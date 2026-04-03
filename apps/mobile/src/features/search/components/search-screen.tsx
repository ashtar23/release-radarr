import React from "react";
import { Stack } from "expo-router";

import { useTheme } from "@/hooks/use-theme";

import { SearchResultsList } from "./search-results-list";
import { SearchStateView } from "./search-state-view";
import { useSearchScreen } from "../hooks/use-search-screen";

export function SearchScreen() {
  const theme = useTheme();
  const { setQuery, searchBarRef, state } = useSearchScreen();

  return (
    <>
      <SearchHeader
        searchBarRef={searchBarRef}
        textColor={theme.text}
        secondaryTextColor={theme.textSecondary}
        onChangeText={setQuery}
      />

      {state.mode === "ready" ? (
        <SearchResultsList
          searchState={state}
          onRetryLoadMore={state.loadMoreResults}
          onEndReached={state.loadMoreResults}
        />
      ) : (
        <SearchStateView state={state} />
      )}
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
