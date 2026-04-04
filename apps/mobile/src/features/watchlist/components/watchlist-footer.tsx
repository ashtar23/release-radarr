import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type WatchlistFooterProps = {
  itemCount: number;
  hasMoreItems: boolean;
  isLoadingMore: boolean;
};

function WatchlistFooter({
  itemCount,
  hasMoreItems,
  isLoadingMore,
}: WatchlistFooterProps) {
  const theme = useTheme();
  const noun = itemCount === 1 ? "item" : "items";

  if (isLoadingMore) {
    return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  if (hasMoreItems) {
    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          Scroll for more
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.footerRow}>
      <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
        End of watchlist. Showing {itemCount} {noun}.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
});

export { WatchlistFooter };
