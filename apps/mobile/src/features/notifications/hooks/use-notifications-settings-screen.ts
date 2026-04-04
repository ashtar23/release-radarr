import type {
  NotificationPreferences,
  NotificationTimingPreset,
} from "@repo/types";
import { useCallback } from "react";

import { useAuthGate } from "@/auth/use-auth-gate";
import { extractErrorMessage } from "@/lib/extract-error-message";

import { useUpdateNotificationPreferencesMutation } from "../mutations/use-update-notification-preferences-mutation";
import { useNotificationPreferencesQuery } from "../queries/use-notification-preferences-query";
import {
  deriveNotificationsSettingsScreenState,
  type NotificationsSettingsScreenReadyState,
} from "../screen-state";

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

type NotificationPreferencesUpdate = Pick<
  NotificationPreferences,
  "channels" | "events" | "timingPresets"
>;

export function useNotificationsSettingsScreen() {
  const { state: authGateState, configError } = useAuthGate();
  const {
    data,
    error,
    isFetching,
    isPending,
    refetch: refetchPreferences,
  } = useNotificationPreferencesQuery();
  const { queueUpdate } = useUpdateNotificationPreferencesMutation();

  const hasLoadedPreferences = data?.preferences != null;
  const preferences = data?.preferences ?? FALLBACK_NOTIFICATION_PREFERENCES;
  const isInitialLoading = !hasLoadedPreferences && isPending;
  const hasBlockingRequestError = !hasLoadedPreferences && error != null;
  const isRefreshing = hasLoadedPreferences && isFetching;
  const hasRefreshError = hasLoadedPreferences && error != null;
  const isInAppEnabled = preferences.channels.inApp;
  const isReleaseApproachingEnabled = preferences.events.releaseApproaching;
  const areEventSettingsDisabled = !isInAppEnabled;
  const areTimingPresetsDisabled =
    areEventSettingsDisabled || !isReleaseApproachingEnabled;

  const updatePreferences = useCallback(
    (nextPreferences: NotificationPreferencesUpdate) => {
      queueUpdate(nextPreferences);
    },
    [queueUpdate],
  );

  const updateInAppChannel = useCallback(
    (inApp: boolean) => {
      updatePreferences({
        channels: { ...preferences.channels, inApp },
        events: preferences.events,
        timingPresets: preferences.timingPresets,
      });
    },
    [preferences, updatePreferences],
  );

  const updateReleaseApproachingEvent = useCallback(
    (releaseApproaching: boolean) => {
      updatePreferences({
        channels: preferences.channels,
        events: {
          ...preferences.events,
          releaseApproaching,
        },
        timingPresets: preferences.timingPresets,
      });
    },
    [preferences, updatePreferences],
  );

  const toggleTimingPreset = useCallback(
    (preset: NotificationTimingPreset) => {
      const isSelected = preferences.timingPresets.includes(preset);

      if (isSelected && preferences.timingPresets.length === 1) {
        return;
      }

      const nextTimingPresets = isSelected
        ? preferences.timingPresets.filter((value) => value !== preset)
        : [...preferences.timingPresets, preset];

      updatePreferences({
        channels: preferences.channels,
        events: preferences.events,
        timingPresets: nextTimingPresets,
      });
    },
    [preferences, updatePreferences],
  );

  const readyState: NotificationsSettingsScreenReadyState = {
    mode: "ready",
    preferences,
    isInAppEnabled,
    areEventSettingsDisabled,
    areTimingPresetsDisabled,
    isRefreshing,
    hasRefreshError,
    updateInAppChannel,
    updateReleaseApproachingEvent,
    toggleTimingPreset,
  };

  const state = deriveNotificationsSettingsScreenState({
    authGateState,
    configError,
    isInitialLoading,
    hasBlockingRequestError,
    requestErrorMessage: extractErrorMessage(
      error,
      "We couldn't load your saved notification preferences right now.",
    ),
    readyState,
    retrying: isFetching,
    onRetry:
      authGateState === "ready" ? () => void refetchPreferences() : undefined,
  });

  return {
    state,
    retry: () => {
      void refetchPreferences();
    },
    retrying: isFetching,
  };
}
