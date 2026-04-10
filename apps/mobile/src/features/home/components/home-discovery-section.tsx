import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import type { TitleSummary } from "@repo/types";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

import { HomeDiscoveryCard } from "./home-discovery-card";

type HomeDiscoverySectionProps = {
  title: string;
  items: TitleSummary[];
};

export function HomeDiscoverySection({ title, items }: HomeDiscoverySectionProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TitleSummary>) => (
      <HomeDiscoveryCard item={item} />
    ),
    [],
  );
  const keyExtractor = useCallback((item: TitleSummary) => item.id, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      <FlashList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  title: {
    paddingHorizontal: Spacing.three,
  },
  listContent: {
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
  },
  separator: {
    width: Spacing.two,
  },
});
