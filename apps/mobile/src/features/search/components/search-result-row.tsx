import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { TitleSummary } from "@repo/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { memo } from "react";
import { Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import { formatSearchMetaLine } from "../utils/format-title";
import { Spacing } from "@/constants/theme";

const COVER_WIDTH = 64;
const COVER_HEIGHT = 90;

type SearchResultRowProps = {
  result: TitleSummary;
};

const SearchResultRow = memo(function SearchResultRow({
  result,
}: SearchResultRowProps) {
  const theme = useTheme();
  const rowStyle = StyleSheet.flatten([
    styles.searchResultItem,
    {
      backgroundColor: theme.card.search.background,
      borderColor: theme.card.search.border,
      shadowColor: theme.card.search.shadow.shadowColor,
      shadowOffset: theme.card.search.shadow.shadowOffset,
      shadowOpacity: theme.card.search.shadow.shadowOpacity,
      shadowRadius: theme.card.search.shadow.shadowRadius,
      elevation: theme.card.search.shadow.elevation,
    },
  ]);

  return (
    <Link
      href={{
        pathname: "/titles/[titleId]",
        params: { titleId: result.id, titleName: result.name },
      }}
      asChild
    >
      <TouchableOpacity
        onPress={Keyboard.dismiss}
        activeOpacity={0.76}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${result.name}`}
        style={rowStyle}
      >
        <View style={styles.coverFrame}>
          {result.coverImageUrl ? (
            <Image
              source={{ uri: result.coverImageUrl }}
              style={styles.coverImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={140}
              accessibilityLabel={`${result.name} cover image`}
            />
          ) : (
            <View
              style={[
                styles.coverFallback,
                { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <AppSymbol
                ios="photo"
                android="image"
                size={18}
                tintColor={theme.textSecondary}
              />
            </View>
          )}
        </View>

        <View style={styles.textColumn}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {result.name}
          </ThemedText>
          <ThemedText
            type="small"
            numberOfLines={1}
            style={[styles.meta, { color: theme.card.search.meta }]}
          >
            {formatSearchMetaLine(result)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

const styles = StyleSheet.create({
  coverFrame: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  searchResultItem: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.two,
    gap: Spacing.three,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  title: {
    lineHeight: 20,
  },
  meta: {
    lineHeight: 18,
  },
});

export { SearchResultRow };
