import type { TitleSearchResult } from "@repo/types";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

type SearchResultsHeaderProps = {
  servedBy: TitleSearchResult["servedBy"] | null;
  showSourceBadge: boolean;
};

function SearchResultsHeader({
  servedBy,
  showSourceBadge,
}: SearchResultsHeaderProps) {
  const theme = useTheme();
  const sourceSummary = servedBy === "rawg-refresh" ? "RAWG refresh" : "Cache";

  if (!showSourceBadge) {
    return null;
  }

  return (
    <View style={styles.resultsHeader}>
      <View style={styles.summaryRow}>
        <View style={[styles.sourceBadge, { borderColor: theme.card.search.meta }]}>
          <ThemedText type="small" style={{ color: theme.card.search.meta }}>
            {sourceSummary}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsHeader: {
    paddingBottom: Spacing.two,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  sourceBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
});

export { SearchResultsHeader };
