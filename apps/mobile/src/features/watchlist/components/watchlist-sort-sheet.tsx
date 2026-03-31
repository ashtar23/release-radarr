import type { WatchlistSort } from "@repo/types";
import { StyleSheet, View } from "react-native";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import {
  getWatchlistSortFamily,
  isWatchlistSortAscending,
  toggleWatchlistSort,
  WATCHLIST_SORT_TOGGLES,
} from "../watchlist-sort";

type WatchlistSortSheetProps = {
  close: () => void;
  sort: WatchlistSort;
  setSort: (sort: WatchlistSort) => void;
};

export function WatchlistSortSheet({
  close,
  sort,
  setSort,
}: WatchlistSortSheetProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <ThemedText type="subtitle">Sort watchlist</ThemedText>

      <ListSection>
        {WATCHLIST_SORT_TOGGLES.map((option) => {
          const isActive = getWatchlistSortFamily(sort) === option.family;
          const nextSort = toggleWatchlistSort(sort, option.family);
          const showAscending = isActive && isWatchlistSortAscending(sort);

          return (
            <ActionRow
              key={option.family}
              onPress={() => {
                setSort(nextSort);
                close();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <ListRow
                label={option.label}
                trailingIcon={
                  isActive ? (
                    <AppSymbol
                      ios={showAscending ? "arrow.up" : "arrow.down"}
                      android={
                        showAscending ? "arrow_upward" : "arrow_downward"
                      }
                      size={18}
                      tintColor={theme.interactive.linkPrimary}
                    />
                  ) : undefined
                }
              />
            </ActionRow>
          );
        })}
      </ListSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
