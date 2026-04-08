import { CenteredRequestErrorState } from "./centered-request-error-state";

type CenteredOfflineStateProps = {
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function CenteredOfflineState({
  description,
  onRetry,
  retrying = false,
}: CenteredOfflineStateProps) {
  return (
    <CenteredRequestErrorState
      title="No internet connection"
      description={description}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}
