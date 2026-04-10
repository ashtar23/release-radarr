import { Link } from "expo-router";
import { FlashList, type ListRenderItemInfo } from "@shopify/flash-list";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { TitleSummary } from "@repo/types";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

import type { HomeDiscoverySectionKey } from "../home-discovery-sections";
import { HomeDiscoveryCard } from "./home-discovery-card";

type HomeDiscoverySectionProps = {
  section: HomeDiscoverySectionKey;
  title: string;
  items: TitleSummary[];
};

export function HomeDiscoverySection({
  section,
  title,
  items,
}: HomeDiscoverySectionProps) {
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
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <Link
          href={{
            pathname: "/(tabs)/home/[section]",
            params: { section },
          }}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
          >
            <ThemedText type="linkPrimary">See all</ThemedText>
          </Pressable>
        </Link>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    paddingHorizontal: 0,
    flex: 1,
  },
  listContent: {
    paddingLeft: Spacing.three,
    paddingRight: Spacing.three,
  },
  separator: {
    width: Spacing.two,
  },
});
