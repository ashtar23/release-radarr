import { EmptyState } from "@/components/empty-state";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type { SearchStateMode } from "../hooks/use-search-screen-state";

interface SearchStateViewProps {
  mode: SearchStateMode;
  query: string;
  errorMessage?: string | null;
}

export function SearchStateView({
  mode,
  query,
  errorMessage,
}: SearchStateViewProps) {
  const theme = useTheme();

  const emptyStateDescription = "Start typing in the search bar to find games.";

  if (mode === "loading")
    return (
      <View style={styles.panel}>
        <EmptyState
          title="Searching..."
          description="Looking up matching games."
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </View>
    );

  if (mode === "error") {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="Search failed"
          description={errorMessage ?? "An unexpected error occurred."}
        />
      </View>
    );
  }

  if (mode === "typing-too-short") {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="Search Games"
          description="Enter at least 2 characters to search."
        />
      </View>
    );
  }

  if (mode === "empty" && query.length >= 2) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="No games found"
          description={`Try another query instead of “${query}”.`}
        />
      </View>
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
