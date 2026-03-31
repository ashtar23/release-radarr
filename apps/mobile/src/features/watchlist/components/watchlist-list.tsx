import React, { useCallback } from "react";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import { Platform, StyleSheet, View } from "react-native";

import type { WatchlistItem } from "@repo/types";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { TitleCardRow } from "@/features/titles/components/title-card-row";
import { WatchlistFooter } from "./watchlist-footer";

type WatchlistListProps = {
  items: WatchlistItem[];
  refreshing: boolean;
  onRefresh?: () => void;
};

export function WatchlistList({
  items,
  refreshing,
  onRefresh,
}: WatchlistListProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WatchlistItem>) => (
      <TitleCardRow result={item.title} />
    ),
    [],
  );
  const keyExtractor = useCallback((item: WatchlistItem) => item.id, []);

  return (
    <FlashList
      style={styles.list}
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      maintainVisibleContentPosition={{ disabled: true }}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={ItemSeparator}
      drawDistance={320}
      ListFooterComponent={<WatchlistFooter itemCount={items.length} />}
    />
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  separator: {
    height: Spacing.two,
  },
});
