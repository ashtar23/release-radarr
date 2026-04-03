import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  notificationTimingPresetValues,
  type NotificationPreferences,
  type NotificationTimingPreset,
} from "@repo/types";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { EmptyState } from "@/components/empty-state";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

import { useNotificationPreferencesQuery } from "../queries/use-notification-preferences-query";
import { useUpdateNotificationPreferencesMutation } from "../queries/use-update-notification-preferences-mutation";
import { CenteredStateFrame } from "@/components/centered-state-frame";
import { ScreenLoadingOverlay } from "@/components/screen-loading-overlay";

const FALLBACK_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    inApp: true,
    push: false,
  },
  events: {
    releaseDateChanged: true,
    releaseApproaching: true,
  },
  timingPresets: ["on_day"],
  updatedAt: new Date(0).toISOString(),
};

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

export function NotificationsSettingsScreen() {
  const theme = useTheme();
  const preferencesQuery = useNotificationPreferencesQuery();
  const updatePreferencesMutation = useUpdateNotificationPreferencesMutation();
  const hasLoadedPreferences = preferencesQuery.data?.preferences != null;
  const preferences =
    preferencesQuery.data?.preferences ?? FALLBACK_NOTIFICATION_PREFERENCES;
  const isInitialLoading = !hasLoadedPreferences && preferencesQuery.isPending;
  const hasBlockingError =
    !hasLoadedPreferences && preferencesQuery.error != null;
  const isBackgroundSyncing =
    hasLoadedPreferences && preferencesQuery.isFetching;
  const isInAppEnabled = preferences.channels.inApp;
  const isReleaseApproachingEnabled = preferences.events.releaseApproaching;
  const areEventSettingsDisabled = isInitialLoading || !isInAppEnabled;
  const areTimingPresetsDisabled =
    areEventSettingsDisabled || !isReleaseApproachingEnabled;

  const updatePreferences = (
    nextPreferences: Pick<
      NotificationPreferences,
      "channels" | "events" | "timingPresets"
    >,
  ) => {
    updatePreferencesMutation.queueUpdate(nextPreferences);
  };

  const toggleTimingPreset = (preset: NotificationTimingPreset) => {
    if (preferences.timingPresets.includes(preset)) {
      if (preferences.timingPresets.length === 1) {
        return;
      }

      updatePreferences({
        channels: preferences.channels,
        events: preferences.events,
        timingPresets: preferences.timingPresets.filter(
          (value) => value !== preset,
        ),
      });
      return;
    }

    const nextTimingPresets = preferences.timingPresets.includes(preset)
      ? preferences.timingPresets.filter((value) => value !== preset)
      : [...preferences.timingPresets, preset];

    updatePreferences({
      channels: preferences.channels,
      events: preferences.events,
      timingPresets: nextTimingPresets,
    });
  };

  if (isInitialLoading) {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Getting notification preferences"
          icon={<ActivityIndicator size="small" color={theme.text} />}
        />
      </CenteredStateFrame>
    );
  }

  if (hasBlockingError) {
    return (
      <CenteredStateFrame>
        <EmptyState
          title="Notification settings unavailable"
          description="We couldn't load your saved notification preferences right now."
        />
      </CenteredStateFrame>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenScrollView>
        <ListSection title="Channels">
          <ListSwitchRow
            label="In-App Notifications"
            subtitle="Show watchlist notifications inside the app."
            value={preferences.channels.inApp}
            onValueChange={(inApp) =>
              updatePreferences({
                channels: { ...preferences.channels, inApp },
                events: preferences.events,
                timingPresets: preferences.timingPresets,
              })
            }
            disabled={isInitialLoading}
          />

          <ListSwitchRow
            label="Push Notifications"
            subtitle="Coming soon. Push delivery is not live yet."
            value={preferences.channels.push}
            onValueChange={() => {}}
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
                onValueChange={(releaseDateChanged) =>
                  updatePreferences({
                    channels: preferences.channels,
                    events: {
                      ...preferences.events,
                      releaseDateChanged,
                    },
                    timingPresets: preferences.timingPresets,
                  })
                }
                disabled
              />

              <ListSwitchRow
                label="Release Approaching"
                subtitle="Notify me before a watched title is due to release."
                value={preferences.events.releaseApproaching}
                onValueChange={(releaseApproaching) =>
                  updatePreferences({
                    channels: preferences.channels,
                    events: {
                      ...preferences.events,
                      releaseApproaching,
                    },
                    timingPresets: preferences.timingPresets,
                  })
                }
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

        {preferencesQuery.error && hasLoadedPreferences ? (
          <ThemedText type="small" themeColor="textSecondary">
            Unable to refresh notification preferences right now.
          </ThemedText>
        ) : null}
      </ScreenScrollView>

      {isBackgroundSyncing ? (
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
