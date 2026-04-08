import type { AuthGateState } from "@/auth/use-auth-gate";

import type {
  NotificationsScreenReadyState,
  NotificationsScreenState,
} from "./types";

const NOTIFICATIONS_CONFIG_ERROR_MESSAGE =
  "Notifications configuration is unavailable.";

type DeriveNotificationsScreenStateInput = {
  authGateState: AuthGateState;
  configError: string | null;
  isInitialLoading: boolean;
  hasBlockingRequestError: boolean;
  requestErrorMessage: string;
  notificationsCount: number;
  readyState: NotificationsScreenReadyState;
  retrying: boolean;
  onRetry?: () => void;
};

export function deriveNotificationsScreenState({
  authGateState,
  configError,
  isInitialLoading,
  hasBlockingRequestError,
  requestErrorMessage,
  notificationsCount,
  readyState,
  retrying,
  onRetry,
}: DeriveNotificationsScreenStateInput): NotificationsScreenState {
  const isConfigError = authGateState === "config-error" || configError != null;

  if (authGateState === "signed-out") {
    return { mode: "signed-out" };
  }

  if (isConfigError) {
    return {
      mode: "config-error",
      errorMessage: configError ?? NOTIFICATIONS_CONFIG_ERROR_MESSAGE,
    };
  }

  if (authGateState === "checking-session" || isInitialLoading) {
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

  if (notificationsCount === 0) {
    return { mode: "empty" };
  }

  return readyState;
}
