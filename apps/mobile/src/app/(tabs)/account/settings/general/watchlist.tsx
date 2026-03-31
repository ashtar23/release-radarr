import { ScrollView, StyleSheet } from "react-native";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { WATCHLIST_SORT_OPTIONS } from "@/features/watchlist/watchlist-sort";

export default function WatchlistSettingsScreen() {
  const { defaultWatchlistSort, setDefaultWatchlistSort } = useAppPreferences();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        {WATCHLIST_SORT_OPTIONS.map((option) => {
          const isSelected = option.value === defaultWatchlistSort;

          return (
            <ActionRow
              key={option.value}
              onPress={() => setDefaultWatchlistSort(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <ListRow
                label={option.label}
                trailingIcon={
                  isSelected ? (
                    <AppSymbol ios="checkmark" android="check" size={18} />
                  ) : undefined
                }
              />
            </ActionRow>
          );
        })}
      </ListSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
});
