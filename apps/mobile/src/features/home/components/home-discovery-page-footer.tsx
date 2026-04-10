import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type HomeDiscoveryPageFooterProps = {
  hasMoreResults: boolean;
  loadedCount: number;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  onRetryLoadMore: () => void;
};

export function HomeDiscoveryPageFooter({
  hasMoreResults,
  loadedCount,
  isLoadingMore,
  loadMoreErrorMessage,
  onRetryLoadMore,
}: HomeDiscoveryPageFooterProps) {
  const theme = useTheme();

  if (isLoadingMore) {
    return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={theme.card.titleCard.meta} />
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          Loading more titles...
        </ThemedText>
      </View>
    );
  }

  if (loadMoreErrorMessage) {
    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          Could not load more titles.
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
    const noun = loadedCount === 1 ? "title" : "titles";

    return (
      <View style={styles.footerRow}>
        <ThemedText type="small" style={{ color: theme.card.titleCard.meta }}>
          End of list. Showing {loadedCount} {noun}.
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
