import { Stack } from "expo-router";
import { useCallback, useMemo } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

import { ScreenLoadingOverlay } from "@/components/screen-loading-overlay";
import { useSheetController } from "@/components/sheets";
import { useTheme } from "@/hooks/use-theme";
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
  const {
    sort,
    setSort,
    setSearchQuery,
    shouldShowControls,
    state,
    isUpdatingSort,
  } = useWatchlistScreen();

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
        tintColor: theme.text,
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
  }, [openSheet, setSort, shouldShowControls, sort, theme.text]);

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
        />
      ) : (
        <WatchlistStateView state={state} />
      )}

      {isUpdatingSort ? <ScreenLoadingOverlay /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
});
