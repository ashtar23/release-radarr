import { Platform, ScrollView, StyleSheet } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { LinkRow } from "@/components/link-row";
import { ListSection } from "@/components/list-section";
import { ListRow } from "@/components/list-row";
import { ListSwitchRow } from "@/components/list-switch-row";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { getWatchlistSortLabel } from "@/features/watchlist/watchlist-sort";
import { useTheme } from "@/hooks/use-theme";

export default function GeneralSettingsScreen() {
  const theme = useTheme();
  const { hapticsEnabled, setHapticsEnabled, defaultWatchlistSort } =
    useAppPreferences();
  const watchlistSortSubtitle = getWatchlistSortLabel(defaultWatchlistSort);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        <LinkRow href="/account/settings/general/watchlist">
          <ListRow
            label="Watchlist Sorting"
            subtitle={watchlistSortSubtitle}
            trailingIcon={
              Platform.OS === "ios" ? (
                <AppSymbol
                  ios="chevron.right"
                  size={13}
                  tintColor={theme.textSecondary}
                />
              ) : undefined
            }
          />
        </LinkRow>

        <ListSwitchRow
          label="Haptics"
          subtitle="Enable subtle touch feedback for supported actions."
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
        />
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
