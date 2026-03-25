import type { TitleSearchResult } from "@repo/types";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View } from "react-native";

type SearchResultsHeaderProps = {
  servedBy: TitleSearchResult["servedBy"] | null;
  decisionReason: TitleSearchResult["decisionReason"] | null;
  showSourceBadge: boolean;
};

function SearchResultsHeader({
  servedBy,
  decisionReason,
  showSourceBadge,
}: SearchResultsHeaderProps) {
  const theme = useTheme();
  const sourceSummary =
    servedBy === "rawg-refresh"
      ? getRawgSourceSummary(decisionReason)
      : "Cache";

  if (!showSourceBadge) {
    return null;
  }

  return (
    <View style={styles.resultsHeader}>
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.sourceBadge,
            { borderColor: theme.card.titleCard.meta },
          ]}
        >
          <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
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

function getRawgSourceSummary(
  decisionReason: TitleSearchResult["decisionReason"] | null,
) {
  if (decisionReason === "forced_refresh") {
    return "RAWG forced";
  }

  if (decisionReason === "sparse_broad_local") {
    return "RAWG sparse";
  }

  return "RAWG refresh";
}
