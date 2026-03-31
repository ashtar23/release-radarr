import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import {
  LIST_ROW_PADDING_HORIZONTAL,
} from "@/components/list-tokens";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type RecentSearchesSectionProps = {
  recentSearches: string[];
  onSearchPress: (query: string) => void;
  onRemoveSearch: (query: string) => void;
  onClearAll: () => void;
};

export function RecentSearchesSection({
  recentSearches,
  onSearchPress,
  onRemoveSearch,
  onClearAll,
}: RecentSearchesSectionProps) {
  const theme = useTheme();

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.root}
    >
      <View style={styles.header}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Recent searches
        </ThemedText>

        <Pressable onPress={onClearAll} accessibilityRole="button">
          <ThemedText type="linkPrimary">Clear all</ThemedText>
        </Pressable>
      </View>

      <ListSection>
        {recentSearches.map((query) => (
          <ListRow key={query}>
            <Pressable
              style={styles.searchAction}
              onPress={() => onSearchPress(query)}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${query}`}
            >
              <AppSymbol
                ios="magnifyingglass"
                android="search"
                size={16}
                tintColor={theme.textSecondary}
              />

              <ThemedText numberOfLines={1} style={styles.queryLabel}>
                {query}
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.removeAction}
              onPress={() => onRemoveSearch(query)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${query} from recent searches`}
              hitSlop={8}
            >
              <AppSymbol
                ios="xmark"
                android="close"
                size={16}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </ListRow>
        ))}
      </ListSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: LIST_ROW_PADDING_HORIZONTAL,
  },
  searchAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  queryLabel: {
    flex: 1,
  },
  removeAction: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
