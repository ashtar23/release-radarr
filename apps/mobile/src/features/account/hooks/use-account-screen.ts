import { useAuthGate } from "@/auth/use-auth-gate";

import {
  deriveAccountScreenState,
  type AccountScreenReadyState,
} from "../screen-state";

export function useAccountScreen() {
  const { state: authGateState, user, configError } = useAuthGate();

  const readyState: AccountScreenReadyState = {
    mode: "ready",
    email: user?.email,
    canSubmit: authGateState === "ready" && !configError,
  };

  const state = deriveAccountScreenState({
    authGateState,
    configError,
    readyState,
  });

  return { state };
}
