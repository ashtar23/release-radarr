import React, { useEffect } from "react";
import { Stack } from "expo-router";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import { useTheme } from "@/hooks/use-theme";
import { useIsOffline } from "@/lib/react-query-online";

import { SearchResultsList } from "./search-results-list";
import { SearchStateView } from "./search-state-view";
import { useSearchScreen } from "../hooks/use-search-screen";

export function SearchScreen() {
  const isOffline = useIsOffline();
  const theme = useTheme();
  const {
    query,
    setQuery,
    searchBarRef,
    state,
    retry,
    retrying,
    canShowOfflineState,
  } = useSearchScreen();

  return (
    <>
      <SearchHeader
        searchBarRef={searchBarRef}
        query={query}
        textColor={theme.text}
        secondaryTextColor={theme.textSecondary}
        onChangeText={setQuery}
      />

      {isOffline && state.mode !== "ready" && canShowOfflineState ? (
        <CenteredOfflineState
          description="Reconnect to search for games."
          onRetry={retry}
          retrying={retrying}
        />
      ) : state.mode === "ready" ? (
        <SearchResultsList
          searchState={state}
          onRetryLoadMore={state.loadMoreResults}
          onEndReached={state.loadMoreResults}
          listHeader={
            isOffline ? (
              <OfflineBanner
                message="You’re offline. Showing the last loaded search results."
                style={styles.offlineBanner}
              />
            ) : null
          }
        />
      ) : (
        <SearchStateView state={state} />
      )}
    </>
  );
}

const styles = {
  offlineBanner: {
    marginBottom: 8,
  },
} as const;

function SearchHeader({
  searchBarRef,
  query,
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
  query: string;
  textColor: string;
  secondaryTextColor: string;
  onChangeText: (query: string) => void;
}) {
  useEffect(() => {
    if (query.length > 0) {
      searchBarRef.current?.setText(query);
      return;
    }

    searchBarRef.current?.clearText();
  }, [query, searchBarRef]);

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
