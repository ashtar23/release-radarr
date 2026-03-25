import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type SearchResultsFooterProps = {
  hasMoreResults: boolean;
  loadedCount: number;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  onRetryLoadMore: () => void;
};

function SearchResultsFooter({
  hasMoreResults,
  loadedCount,
  isLoadingMore,
  loadMoreErrorMessage,
  onRetryLoadMore,
}: SearchResultsFooterProps) {
  const theme = useTheme();

  if (isLoadingMore) {
    return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={theme.card.titleCard.meta} />
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          Loading more results...
        </ThemedText>
      </View>
    );
  }

  if (loadMoreErrorMessage) {
    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          Could not load more results.
        </ThemedText>
        <Pressable onPress={onRetryLoadMore}>
          <ThemedText type="smallBold" style={{ color: theme.text }}>
            Retry
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!hasMoreResults) {
    const noun = loadedCount === 1 ? "result" : "results";

    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          End of results. Showing {loadedCount} of {loadedCount} {noun}.
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
