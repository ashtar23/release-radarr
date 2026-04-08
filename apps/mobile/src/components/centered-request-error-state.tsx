import { Button } from "@/components/button";

import { CenteredEmptyState } from "./centered-empty-state";

type CenteredRequestErrorStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function CenteredRequestErrorState({
  title,
  description,
  onRetry,
  retrying = false,
}: CenteredRequestErrorStateProps) {
  return (
    <CenteredEmptyState
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button
            label={retrying ? "Trying again..." : "Try again"}
            tone="neutral"
            loading={retrying}
            disabled={retrying}
            onPress={onRetry}
          />
        ) : undefined
      }
    />
  );
}
