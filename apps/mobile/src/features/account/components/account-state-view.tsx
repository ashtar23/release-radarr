import React from "react";

import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";

import type { AccountScreenNonReadyState } from "../screen-state";

type AccountStateViewProps = {
  state: AccountScreenNonReadyState;
};

export function AccountStateView({ state }: AccountStateViewProps) {
  if (state.mode === "checking-session") {
    return (
      <CenteredLoadingState
        title="Checking your session..."
        description="Loading your account access."
      />
    );
  }

  return (
    <CenteredConfigErrorState
      title="Account is unavailable"
      description={
        state.errorMessage ?? "Account configuration is unavailable."
      }
      helpText="Check the Supabase environment configuration for this build."
    />
  );
}
