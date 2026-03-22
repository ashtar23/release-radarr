import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

type SearchResultsHeaderProps = {
  query: string;
  resultCount: number;
};

function SearchResultsHeader({ query, resultCount }: SearchResultsHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.resultsHeader}>
      <ThemedText
        type="small"
        style={[styles.resultsHeaderText, { color: theme.card.search.meta }]}
      >
        {resultCount} {resultCount === 1 ? "result" : "results"} for {query}
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
