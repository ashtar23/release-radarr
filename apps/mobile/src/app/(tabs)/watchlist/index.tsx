import type { HeaderAction } from "@/features/navigation/header-actions";
import { HeaderActions } from "@/features/navigation/header-actions";
import { WatchlistSortSheet } from "@/features/watchlist/components/watchlist-sort-sheet";
import { WatchlistList } from "@/features/watchlist/components/watchlist-list";
import { WatchlistStateView } from "@/features/watchlist/components/watchlist-state-view";
import { useWatchlistFeature } from "@/features/watchlist/hooks/use-watchlist-feature";
import {
  getWatchlistSortFamily,
  isWatchlistSortAscending,
  toggleWatchlistSort,
  WATCHLIST_SORT_TOGGLES,
} from "@/features/watchlist/watchlist-sort";
import { useSheetController } from "@/components/sheets";
import { Stack } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useCallback, useMemo } from "react";

export default function WatchlistScreen() {
  const watchlistFeature = useWatchlistFeature();
  const { openSheet } = useSheetController();
  const itemCount = watchlistFeature.items.length;
  const filteredItemCount = watchlistFeature.filteredItems.length;
  const { sort, setSort, searchQuery, setSearchQuery } = watchlistFeature;

  const handleSearchChange = useCallback(
    (event: { nativeEvent: { text: string } }) => {
      setSearchQuery(event.nativeEvent.text);
    },
    [setSearchQuery],
  );

  const headerActions = useMemo<HeaderAction[]>(() => {
    if (itemCount === 0) {
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
  }, [itemCount, openSheet, setSort, sort]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {itemCount > 0 ? (
        <Stack.SearchBar
          placeholder="Search watchlist"
          onChangeText={handleSearchChange}
        />
      ) : null}

      <HeaderActions actions={headerActions} />

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
