import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

type WatchlistFooterProps = {
  itemCount: number;
};

function WatchlistFooter({ itemCount }: WatchlistFooterProps) {
  const theme = useTheme();
  const noun = itemCount === 1 ? "item" : "items";

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
