import { StyleSheet, View } from "react-native";
import {
  notificationTimingPresetValues,
  type NotificationTimingPreset,
} from "@repo/types";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";

import { ScreenLoadingOverlay } from "@/components/screen-loading-overlay";
import { useNotificationsSettingsScreen } from "../hooks/use-notifications-settings-screen";
import { NotificationsSettingsStateView } from "./notifications-settings-state-view";

const TIMING_PRESET_META: Record<
  NotificationTimingPreset,
  { label: string; subtitle: string }
> = {
  on_day: {
    label: "On release day",
    subtitle: "Get notified the day a watched title is due to release.",
  },
  hours_24_before: {
    label: "24 hours before",
    subtitle: "Get notified about one day before release.",
  },
  days_7_before: {
    label: "7 days before",
    subtitle: "Get notified one week before release.",
  },
  days_30_before: {
    label: "30 days before",
    subtitle: "Get notified about one month before release.",
  },
};

const RELEASE_DATE_CHANGES_AVAILABLE = false;
const noop = () => {};

export function NotificationsSettingsScreen() {
  const { state } = useNotificationsSettingsScreen();

  if (state.mode !== "ready") {
    return <NotificationsSettingsStateView state={state} />;
  }

  const {
    preferences,
    isInAppEnabled,
    areEventSettingsDisabled,
    areTimingPresetsDisabled,
    isRefreshing,
    hasRefreshError,
    updateInAppChannel,
    updateReleaseApproachingEvent,
    toggleTimingPreset,
  } = state;

  return (
    <View style={styles.container}>
      <ScreenScrollView>
        <ListSection title="Channels">
          <ListSwitchRow
            label="In-App Notifications"
            subtitle="Show watchlist notifications inside the app."
            value={preferences.channels.inApp}
            onValueChange={updateInAppChannel}
          />

          <ListSwitchRow
            label="Push Notifications"
            subtitle="Coming soon. Push delivery is not live yet."
            value={preferences.channels.push}
            onValueChange={noop}
            disabled
          />
        </ListSection>

        {isInAppEnabled ? (
          <>
            <ListSection title="Events">
              <ListSwitchRow
                label="Release Date Changes"
                subtitle="Coming soon. Automatic release date change notifications are not live yet."
                value={
                  RELEASE_DATE_CHANGES_AVAILABLE
                    ? preferences.events.releaseDateChanged
                    : false
                }
                onValueChange={noop}
                disabled
              />

              <ListSwitchRow
                label="Release Approaching"
                subtitle="Notify me before a watched title is due to release."
                value={preferences.events.releaseApproaching}
                onValueChange={updateReleaseApproachingEvent}
                disabled={areEventSettingsDisabled}
              />
            </ListSection>

            <ListSection
              title="Timing Presets"
              footer="Select at least one notification time."
            >
              {notificationTimingPresetValues.map((preset) => {
                const meta = TIMING_PRESET_META[preset];
                const isSelected = preferences.timingPresets.includes(preset);

                return (
                  <ActionRow
                    key={preset}
                    onPress={() => toggleTimingPreset(preset)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: isSelected,
                      disabled: areTimingPresetsDisabled,
                    }}
                    disabled={areTimingPresetsDisabled}
                  >
                    <ListRow
                      label={meta.label}
                      subtitle={meta.subtitle}
                      disabled={areTimingPresetsDisabled}
                      trailingIcon={
                        isSelected ? (
                          <AppSymbol
                            ios="checkmark"
                            android="check"
                            size={18}
                          />
                        ) : undefined
                      }
                    />
                  </ActionRow>
                );
              })}
            </ListSection>
          </>
        ) : null}

        {hasRefreshError ? (
          <ThemedText type="small" themeColor="textSecondary">
            Unable to refresh notification preferences right now.
          </ThemedText>
        ) : null}
      </ScreenScrollView>

      {isRefreshing ? (
        <ScreenLoadingOverlay label="Refreshing notification preferences" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
