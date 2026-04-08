import type { HomeScreenReadyState, HomeScreenState } from "./types";

const HOME_CONFIG_ERROR_MESSAGE =
  "Check the API client environment configuration for this build.";

type DeriveHomeScreenStateInput = {
  configError: string | null;
  isInitialLoading: boolean;
  hasBlockingRequestError: boolean;
  requestErrorMessage: string;
  onRetry?: () => void;
  retrying: boolean;
  hasAnySection: boolean;
  readyState: HomeScreenReadyState;
};

export function deriveHomeScreenState({
  configError,
  isInitialLoading,
  hasBlockingRequestError,
  requestErrorMessage,
  onRetry,
  retrying,
  hasAnySection,
  readyState,
}: DeriveHomeScreenStateInput): HomeScreenState {
  if (configError) {
    return {
      mode: "config-error",
      errorMessage: configError ?? HOME_CONFIG_ERROR_MESSAGE,
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

  if (!hasAnySection) {
    return { mode: "empty" };
  }

  return readyState;
}
