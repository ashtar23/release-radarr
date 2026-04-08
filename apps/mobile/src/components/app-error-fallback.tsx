import { Button } from "@/components/button";

import { CenteredEmptyState } from "./centered-empty-state";

type AppErrorFallbackProps = {
  error: Error;
  onReset?: () => void;
};

export function AppErrorFallback({ error, onReset }: AppErrorFallbackProps) {
  return (
    <CenteredEmptyState
      title="Something went wrong"
      description={error.message || "The app ran into an unexpected error."}
      action={
        onReset ? (
          <Button label="Try again" tone="neutral" onPress={onReset} />
        ) : undefined
      }
    />
  );
}
