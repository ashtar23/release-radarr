import { useAuth } from "./auth-provider";

export type AuthGateState =
  | "checking-session"
  | "config-error"
  | "signed-out"
  | "ready";

export function useAuthGate() {
  const { user, isReady, configError } = useAuth();

  const state: AuthGateState = !isReady
    ? "checking-session"
    : configError
      ? "config-error"
      : user
        ? "ready"
        : "signed-out";

  return {
    state,
    user,
    isReady,
    configError,
    isSignedIn: user != null,
  };
}
