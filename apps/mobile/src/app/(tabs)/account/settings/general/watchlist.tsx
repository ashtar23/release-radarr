import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { WATCHLIST_SORT_OPTIONS } from "@/features/watchlist/watchlist-sort";

export default function WatchlistSettingsScreen() {
  const { defaultWatchlistSort, setDefaultWatchlistSort } = useAppPreferences();

  return (
    <ScreenScrollView>
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
    </ScreenScrollView>
  );
}
