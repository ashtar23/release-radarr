import type { AccountScreenReadyState, AccountScreenState } from "./types";
import type { AuthGateState } from "@/auth/use-auth-gate";

type DeriveAccountScreenStateInput = {
  authGateState: AuthGateState;
  configError: string | null;
  readyState: AccountScreenReadyState;
};

export function deriveAccountScreenState({
  authGateState,
  configError,
  readyState,
}: DeriveAccountScreenStateInput): AccountScreenState {
  if (authGateState === "checking-session") {
    return { mode: "checking-session" };
  }

  if (authGateState === "config-error") {
    return {
      mode: "config-error",
      errorMessage: configError,
    };
  }

  if (authGateState === "signed-out") {
    return { mode: "signed-out" };
  }

  return readyState;
}
