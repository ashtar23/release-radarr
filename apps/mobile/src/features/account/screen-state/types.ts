export type AccountScreenReadyState = {
  mode: "ready";
  email: string | null | undefined;
  canSubmit: boolean;
};

export type AccountScreenSignedOutState = {
  mode: "signed-out";
};

export type AccountScreenNonReadyState =
  | { mode: "checking-session" }
  | {
      mode: "config-error";
      errorMessage: string | null;
    };

export type AccountScreenState =
  | AccountScreenNonReadyState
  | AccountScreenSignedOutState
  | AccountScreenReadyState;
