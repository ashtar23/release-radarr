import { Platform } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { LinkRow } from "@/components/link-row";
import { ListSection } from "@/components/list-section";
import { ListRow } from "@/components/list-row";
import { ListSwitchRow } from "@/components/list-switch-row";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { getWatchlistSortLabel } from "@/features/watchlist/watchlist-sort";
import { useTheme } from "@/hooks/use-theme";

export default function GeneralSettingsScreen() {
  const theme = useTheme();
  const { hapticsEnabled, setHapticsEnabled, defaultWatchlistSort } =
    useAppPreferences();
  const watchlistSortSubtitle = getWatchlistSortLabel(defaultWatchlistSort);

  return (
    <ScreenScrollView>
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
    </ScreenScrollView>
  );
}
