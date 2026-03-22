import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

type SearchResultsHeaderProps = {
  query: string;
  loadedCount: number;
  hasMoreResults: boolean;
};

function SearchResultsHeader({
  query,
  loadedCount,
  hasMoreResults,
}: SearchResultsHeaderProps) {
  const theme = useTheme();
  const noun = loadedCount === 1 ? "result" : "results";
  const summary = hasMoreResults
    ? `Showing ${loadedCount} ${noun} for ${query}`
    : `Showing ${loadedCount} of ${loadedCount} ${noun} for ${query}`;

  return (
    <View style={styles.resultsHeader}>
      <ThemedText
        type="small"
        style={[styles.resultsHeaderText, { color: theme.card.search.meta }]}
      >
        {summary}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsHeader: {
    paddingBottom: Spacing.two,
  },
  resultsHeaderText: {
    fontWeight: "600",
  },
});

export { SearchResultsHeader };
