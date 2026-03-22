import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type SearchResultsFooterProps = {
  hasMoreResults: boolean;
  isLoadingMore: boolean;
};

function SearchResultsFooter({
  hasMoreResults,
  isLoadingMore,
}: SearchResultsFooterProps) {
  const theme = useTheme();

  if (isLoadingMore) {
    return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={theme.card.search.meta} />
        <ThemedText type="small" style={{ color: theme.card.search.meta }}>
          Loading more results...
        </ThemedText>
      </View>
    );
  }

  if (!hasMoreResults) {
    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.search.meta }}>
          End of results
        </ThemedText>
      </View>
    );
  }

  return <View style={styles.footerSpacer} />;
}

const styles = StyleSheet.create({
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  footerSpacer: {
    height: Spacing.three,
  },
});

export { SearchResultsFooter };
