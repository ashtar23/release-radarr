import type { AuthGateState } from "@/auth/use-auth-gate";
import { useAuth } from "@/auth/auth-provider";
import { useAuthGate } from "@/auth/use-auth-gate";

export type ProtectedOfflineRetryState = {
  onRetry: () => void;
  retrying: boolean;
};

type UseProtectedOfflineRetryParams = {
  authGateState?: AuthGateState;
  retrying?: boolean;
  onRetryReady?: () => void;
};

export function useProtectedOfflineRetry({
  authGateState: authGateStateOverride,
  retrying = false,
  onRetryReady,
}: UseProtectedOfflineRetryParams = {}): ProtectedOfflineRetryState {
  const { refreshSession } = useAuth();
  const { state: authGateStateFromHook } = useAuthGate();
  const authGateState = authGateStateOverride ?? authGateStateFromHook;

  return {
    retrying: authGateState === "ready" ? retrying : false,
    onRetry: () => {
      if (authGateState === "ready" && onRetryReady) {
        onRetryReady();
        return;
      }

      void refreshSession();
    },
  };
}
