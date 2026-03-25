import { AppSymbol } from "@/components/app-symbol";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { TitleSummary } from "@repo/types";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { memo } from "react";
import { Keyboard, StyleSheet, TouchableOpacity, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { formatTitleCardMetaLine } from "../utils/title-card-meta";

const COVER_WIDTH = 64;
const COVER_HEIGHT = 90;

type TitleCardRowProps = {
  result: TitleSummary;
};

const TitleCardRow = memo(function TitleCardRow({ result }: TitleCardRowProps) {
  const theme = useTheme();
  const rowStyle = StyleSheet.flatten([
    styles.titleCardItem,
    {
      backgroundColor: theme.card.titleCard.background,
      borderColor: theme.card.titleCard.border,
      shadowColor: theme.card.titleCard.shadow.shadowColor,
      shadowOffset: theme.card.titleCard.shadow.shadowOffset,
      shadowOpacity: theme.card.titleCard.shadow.shadowOpacity,
      shadowRadius: theme.card.titleCard.shadow.shadowRadius,
      elevation: theme.card.titleCard.shadow.elevation,
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
            style={[styles.meta, { color: theme.card.titleCard.meta }]}
          >
            {formatTitleCardMetaLine(result)}
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
  titleCardItem: {
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

export { TitleCardRow };
