import { EmptyState } from "@/components/empty-state";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { RecentSearchesSection } from "./recent-searches-section";
import type { SearchScreenNonReadyState } from "../screen-state";

interface SearchStateViewProps {
  state: SearchScreenNonReadyState;
}

export function SearchStateView({ state }: SearchStateViewProps) {
  const theme = useTheme();

  const emptyStateDescription = "Start typing in the search bar to find games.";

  if (state.mode === "loading")
    return (
      <View style={styles.panel}>
        <EmptyState
          title="Searching..."
          description="Looking up matching games."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </View>
    );

  if (state.mode === "request-error") {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="Search failed"
          description={state.errorMessage ?? "An unexpected error occurred."}
        />
      </View>
    );
  }

  if (state.mode === "typing-too-short") {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="Search Games"
          description="Enter at least 2 characters to search."
        />
      </View>
    );
  }

  if (state.mode === "empty" && state.query.length >= 2) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="No games found"
          description={`Try another query instead of “${state.query}”.`}
        />
      </View>
    );
  }

  if (state.mode === "idle" && state.recentSearches.length > 0) {
    return (
      <RecentSearchesSection
        recentSearches={state.recentSearches}
        onSearchPress={state.onRecentSearchPress}
        onRemoveSearch={state.onRemoveRecentSearch}
        onClearAll={state.onClearRecentSearches}
      />
    );
  }

  return (
    <View style={styles.emptyRoot}>
      <EmptyState title="Search Games" description={emptyStateDescription} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
  },
  emptyRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
});
