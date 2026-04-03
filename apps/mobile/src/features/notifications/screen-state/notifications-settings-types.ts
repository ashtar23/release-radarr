import type {
  NotificationPreferences,
  NotificationTimingPreset,
} from "@repo/types";

export type NotificationsSettingsScreenReadyState = {
  mode: "ready";
  preferences: NotificationPreferences;
  isInAppEnabled: boolean;
  areEventSettingsDisabled: boolean;
  areTimingPresetsDisabled: boolean;
  isRefreshing: boolean;
  hasRefreshError: boolean;
  updateInAppChannel: (inApp: boolean) => void;
  updateReleaseApproachingEvent: (releaseApproaching: boolean) => void;
  toggleTimingPreset: (preset: NotificationTimingPreset) => void;
};

export type NotificationsSettingsScreenNonReadyState =
  | { mode: "checking-session" }
  | { mode: "signed-out" }
  | {
      mode: "config-error";
      errorMessage: string;
    }
  | { mode: "loading" }
  | {
      mode: "request-error";
      errorMessage: string;
      onRetry?: () => void;
      retrying: boolean;
    };

export type NotificationsSettingsScreenState =
  | NotificationsSettingsScreenNonReadyState
  | NotificationsSettingsScreenReadyState;
