import type { AuthGateState } from "@/auth/use-auth-gate";

import type {
  NotificationsSettingsScreenReadyState,
  NotificationsSettingsScreenState,
} from "./notifications-settings-types";

const NOTIFICATIONS_SETTINGS_CONFIG_ERROR_MESSAGE =
  "Notification settings configuration is unavailable.";

type DeriveNotificationsSettingsScreenStateInput = {
  authGateState: AuthGateState;
  configError: string | null;
  isInitialLoading: boolean;
  hasBlockingRequestError: boolean;
  requestErrorMessage: string;
  readyState: NotificationsSettingsScreenReadyState;
  retrying: boolean;
  onRetry?: () => void;
};

export function deriveNotificationsSettingsScreenState({
  authGateState,
  configError,
  isInitialLoading,
  hasBlockingRequestError,
  requestErrorMessage,
  readyState,
  retrying,
  onRetry,
}: DeriveNotificationsSettingsScreenStateInput): NotificationsSettingsScreenState {
  const isConfigError = authGateState === "config-error" || configError != null;

  if (authGateState === "checking-session") {
    return { mode: "checking-session" };
  }

  if (authGateState === "signed-out") {
    return { mode: "signed-out" };
  }

  if (isConfigError) {
    return {
      mode: "config-error",
      errorMessage: configError ?? NOTIFICATIONS_SETTINGS_CONFIG_ERROR_MESSAGE,
    };
  }

  if (isInitialLoading) {
    return { mode: "loading" };
  }

  if (hasBlockingRequestError) {
    return {
      mode: "request-error",
      errorMessage: requestErrorMessage,
      onRetry,
      retrying,
    };
  }

  return readyState;
}
