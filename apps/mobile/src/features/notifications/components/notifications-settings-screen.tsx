import { StyleSheet, View } from "react-native";
import {
  notificationTimingPresetValues,
  type NotificationTimingPreset,
} from "@repo/types";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { CenteredOfflineState } from "@/components/centered-offline-state";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { OfflineBanner } from "@/components/offline-banner";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useProtectedOfflineRetry } from "@/lib/offline-screen";
import { useIsOffline } from "@/lib/react-query-online";

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
  const isOffline = useIsOffline();
  const { state, retry, retrying } = useNotificationsSettingsScreen();
  const offlineRetry = useProtectedOfflineRetry({
    onRetryReady: retry,
    retrying,
  });

  if (isOffline && state.mode !== "ready") {
    return (
      <CenteredOfflineState
        description="Reconnect to load and update your notification preferences."
        onRetry={offlineRetry.onRetry}
        retrying={offlineRetry.retrying}
      />
    );
  }

  return state.mode !== "ready" ? (
    <NotificationsSettingsStateView state={state} />
  ) : (
    <View style={styles.container}>
      <ScreenScrollView>
        {isOffline ? (
          <OfflineBanner
            message="You’re offline. Showing your last saved notification preferences."
            style={styles.offlineBanner}
          />
        ) : null}

        <ListSection title="Channels">
          <ListSwitchRow
            label="In-App Notifications"
            subtitle="Show watchlist notifications inside the app."
            value={state.preferences.channels.inApp}
            onValueChange={state.updateInAppChannel}
            disabled={isOffline}
          />

          <ListSwitchRow
            label="Push Notifications"
            subtitle="Coming soon. Push delivery is not live yet."
            value={state.preferences.channels.push}
            onValueChange={noop}
            disabled
          />
        </ListSection>

        {state.isInAppEnabled ? (
          <>
            <ListSection title="Events">
              <ListSwitchRow
                label="Release Date Changes"
                subtitle="Coming soon. Automatic release date change notifications are not live yet."
                value={
                  RELEASE_DATE_CHANGES_AVAILABLE
                    ? state.preferences.events.releaseDateChanged
                    : false
                }
                onValueChange={noop}
                disabled
              />

              <ListSwitchRow
                label="Release Approaching"
                subtitle="Notify me before a watched title is due to release."
                value={state.preferences.events.releaseApproaching}
                onValueChange={state.updateReleaseApproachingEvent}
                disabled={isOffline || state.areEventSettingsDisabled}
              />
            </ListSection>

            <ListSection
              title="Timing Presets"
              footer="Select at least one notification time."
            >
              {notificationTimingPresetValues.map((preset) => {
                const meta = TIMING_PRESET_META[preset];
                const isSelected =
                  state.preferences.timingPresets.includes(preset);

                return (
                  <ActionRow
                    key={preset}
                    onPress={() => state.toggleTimingPreset(preset)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: isSelected,
                      disabled: isOffline || state.areTimingPresetsDisabled,
                    }}
                    disabled={isOffline || state.areTimingPresetsDisabled}
                  >
                    <ListRow
                      label={meta.label}
                      subtitle={meta.subtitle}
                      disabled={isOffline || state.areTimingPresetsDisabled}
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

        {state.hasRefreshError ? (
          <ThemedText type="small" themeColor="textSecondary">
            Unable to refresh notification preferences right now.
          </ThemedText>
        ) : null}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    marginBottom: Spacing.one,
  },
});
