import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { TitleSummary } from "@repo/types";

import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { formatReleaseDateCompact } from "@/features/search/utils/format-title";
import { useTheme } from "@/hooks/use-theme";

type HomeDiscoveryCardProps = {
  item: TitleSummary;
};

export function HomeDiscoveryCard({ item }: HomeDiscoveryCardProps) {
  const theme = useTheme();

  return (
    <Link
      href={{
        pathname: "/titles/[titleId]",
        params: { titleId: item.id, titleName: item.name },
      }}
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${item.name}`}
        style={styles.card}
      >
        <View
          style={[
            styles.imageFrame,
            { backgroundColor: theme.card.titleCard.background },
          ]}
        >
          {item.coverImageUrl ? (
            <Image
              source={{ uri: item.coverImageUrl }}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={140}
              accessibilityLabel={`${item.name} cover image`}
            />
          ) : (
            <View
              style={[
                styles.imageFallback,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <AppSymbol
                ios="photo"
                android="image"
                size={20}
                tintColor={theme.textSecondary}
              />
            </View>
          )}
        </View>

        <ThemedText type="smallBold" numberOfLines={2} style={styles.title}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {buildMetaLine(item)}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

function buildMetaLine(item: TitleSummary) {
  const releaseText = formatReleaseDateCompact(item.earliestReleaseDate);
  const platformText = formatPlatformSummary(item);
  return `${releaseText} • ${platformText}`;
}

function formatPlatformSummary(item: TitleSummary) {
  if (!item.platforms.length) {
    return "Platforms TBA";
  }

  const [firstPlatform, ...rest] = item.platforms;
  if (!firstPlatform) {
    return "Platforms TBA";
  }

  return rest.length > 0
    ? `${firstPlatform.name} +${rest.length}`
    : firstPlatform.name;
}

const CARD_WIDTH = 220;
const CARD_IMAGE_HEIGHT = 138;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    gap: Spacing.one,
  },
  imageFrame: {
    width: CARD_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    minHeight: 36,
  },
});
