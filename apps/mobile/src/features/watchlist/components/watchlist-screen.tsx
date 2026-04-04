import { Stack } from "expo-router";
import { useCallback, useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import { ScreenLoadingOverlay } from "@/components/screen-loading-overlay";
import { useSheetController } from "@/components/sheets";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useIsOffline } from "@/lib/react-query-online";
import { useProtectedOfflineRetry } from "@/lib/offline-screen";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";

import { WatchlistList } from "./watchlist-list";
import { WatchlistSortSheet } from "./watchlist-sort-sheet";
import { WatchlistStateView } from "./watchlist-state-view";
import { useWatchlistScreen } from "../hooks/use-watchlist-screen";
import {
  getWatchlistSortFamily,
  isWatchlistSortAscending,
  toggleWatchlistSort,
  WATCHLIST_SORT_TOGGLES,
} from "../watchlist-sort";

export function WatchlistScreen() {
  const theme = useTheme();
  const { openSheet } = useSheetController();
  const isOffline = useIsOffline();
  const {
    sort,
    setSort,
    setSearchQuery,
    shouldShowControls,
    showLoadingOverlay,
    state,
    retry,
    retrying,
  } = useWatchlistScreen();
  const offlineRetry = useProtectedOfflineRetry({
    onRetryReady: retry,
    retrying,
  });
  const canKeepShowingContentOffline =
    state.mode === "ready" ||
    state.mode === "empty" ||
    state.mode === "search-empty";

  const handleSearchChange = useCallback(
    (event: { nativeEvent: { text: string } }) => {
      setSearchQuery(event.nativeEvent.text);
    },
    [setSearchQuery],
  );

  const headerActions = useMemo<HeaderAction[]>(() => {
    if (!shouldShowControls) {
      return [];
    }

    if (Platform.OS === "ios") {
      return [
        {
          kind: "menu",
          id: "sort-watchlist",
          label: "Sort watchlist",
          iosIcon: "arrow.up.arrow.down.circle",
          menuTitle: "Sort watchlist",
          items: WATCHLIST_SORT_TOGGLES.map((option) => ({
            id: option.family,
            label: option.label,
            iosIcon:
              getWatchlistSortFamily(sort) === option.family
                ? isWatchlistSortAscending(sort)
                  ? "chevron.up"
                  : "chevron.down"
                : undefined,
            isOn: getWatchlistSortFamily(sort) === option.family,
            disabled: isOffline,
            onPress: () => setSort(toggleWatchlistSort(sort, option.family)),
          })),
          disabled: isOffline,
        },
      ];
    }

    return [
      {
        kind: "button",
        id: "sort-watchlist",
        label: "Sort watchlist",
        iosIcon: "arrow.up.arrow.down.circle",
        androidIcon: "swap_vert",
        tintColor: theme.text,
        disabled: isOffline,
        onPress: () => {
          openSheet({
            component: ({ close }) => (
              <WatchlistSortSheet close={close} sort={sort} setSort={setSort} />
            ),
            snapPoints: ["40%"],
            enableDynamicSizing: true,
          });
        },
      },
    ];
  }, [isOffline, openSheet, setSort, shouldShowControls, sort, theme.text]);

  if (isOffline && !canKeepShowingContentOffline) {
    return (
      <CenteredOfflineState
        description="Reconnect to load your watchlist and manage tracked games."
        onRetry={offlineRetry.onRetry}
        retrying={offlineRetry.retrying}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <HeaderActions actions={headerActions} />

      {shouldShowControls ? (
        <Stack.SearchBar
          placeholder="Search watchlist"
          shouldShowHintSearchIcon={false}
          textColor={theme.text}
          headerIconColor={theme.text}
          tintColor={theme.textSecondary}
          hintTextColor={theme.textSecondary}
          onChangeText={handleSearchChange}
        />
      ) : null}

      {state.mode === "ready" ? (
        <WatchlistList
          items={state.filteredItems}
          refreshing={state.refreshing}
          onRefresh={state.onRefresh}
          hasMoreItems={state.hasMoreItems}
          isLoadingMore={state.isLoadingMore}
          onEndReached={state.loadMoreItems}
          listHeader={
            isOffline ? (
              <OfflineBanner
                message="You’re offline. Showing your last loaded watchlist state."
                style={styles.offlineBanner}
              />
            ) : null
          }
        />
      ) : (
        <WatchlistStateView state={state} />
      )}

      {showLoadingOverlay ? (
        <ScreenLoadingOverlay
          pointerEvents="none"
          label="Updating watchlist..."
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  offlineBanner: {
    marginBottom: Spacing.two,
  },
});
