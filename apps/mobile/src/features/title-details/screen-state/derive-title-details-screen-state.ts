import type {
  TitleDetailsScreenReadyState,
  TitleDetailsScreenState,
} from "./types";

type DeriveTitleDetailsScreenStateInput = {
  configError: string | null;
  titleId: string;
  isInitialLoading: boolean;
  hasBlockingRequestError: boolean;
  requestErrorMessage: string;
  onRetry?: () => void;
  retrying: boolean;
  readyState: TitleDetailsScreenReadyState | null;
};

export function deriveTitleDetailsScreenState({
  configError,
  titleId,
  isInitialLoading,
  hasBlockingRequestError,
  requestErrorMessage,
  onRetry,
  retrying,
  readyState,
}: DeriveTitleDetailsScreenStateInput): TitleDetailsScreenState {
  if (configError) {
    return {
      mode: "config-error",
      errorMessage: configError,
    };
  }

  if (titleId.length === 0) {
    return { mode: "invalid-title" };
  }

  if (isInitialLoading) {
    return { mode: "loading" };
  }

  if (hasBlockingRequestError || readyState == null) {
    return {
      mode: "request-error",
      errorMessage: requestErrorMessage,
      onRetry,
      retrying,
    };
  }

  return readyState;
}
