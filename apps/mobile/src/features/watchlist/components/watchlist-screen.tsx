import { Stack } from "expo-router";
import { useCallback, useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

import { useSheetController } from "@/components/sheets";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";

import { WatchlistList } from "./watchlist-list";
import { WatchlistSortSheet } from "./watchlist-sort-sheet";
import { WatchlistStateView } from "./watchlist-state-view";
import { useWatchlistFeature } from "../hooks/use-watchlist-feature";
import {
  getWatchlistSortFamily,
  isWatchlistSortAscending,
  toggleWatchlistSort,
  WATCHLIST_SORT_TOGGLES,
} from "../watchlist-sort";

export function WatchlistScreen() {
  const watchlistFeature = useWatchlistFeature();
  const { openSheet } = useSheetController();
  const itemCount = watchlistFeature.items.length;
  const filteredItemCount = watchlistFeature.filteredItems.length;
  const { sort, setSort, searchQuery, setSearchQuery, shouldShowControls } =
    watchlistFeature;

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
            onPress: () => setSort(toggleWatchlistSort(sort, option.family)),
          })),
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
  }, [openSheet, setSort, shouldShowControls, sort]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {shouldShowControls ? (
        <>
          <HeaderActions actions={headerActions} />
          <Stack.SearchBar
            placeholder="Search watchlist"
            onChangeText={handleSearchChange}
          />
        </>
      ) : null}

      {itemCount > 0 && filteredItemCount > 0 ? (
        <WatchlistList
          items={watchlistFeature.filteredItems}
          refreshing={watchlistFeature.refreshing}
          onRefresh={watchlistFeature.onRefresh}
        />
      ) : (
        <WatchlistStateView
          mode={watchlistFeature.mode}
          searchQuery={searchQuery}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
});
