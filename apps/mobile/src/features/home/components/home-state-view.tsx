import React from "react";

import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredEmptyState } from "@/components/centered-empty-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";

import type { HomeScreenNonReadyState } from "../screen-state";

type HomeStateViewProps = {
  state: HomeScreenNonReadyState;
};

export function HomeStateView({ state }: HomeStateViewProps) {
  if (state.mode === "loading") {
    return (
      <CenteredLoadingState
        title="Loading discovery..."
        description="Pulling upcoming, latest, and popular games."
      />
    );
  }

  if (state.mode === "config-error") {
    return (
      <CenteredConfigErrorState
        title="Home is unavailable"
        description={state.errorMessage}
        helpText="Check the API client environment configuration for this build."
      />
    );
  }

  if (state.mode === "request-error") {
    return (
      <CenteredRequestErrorState
        title="Couldn't load discovery"
        description={state.errorMessage}
        onRetry={state.onRetry}
        retrying={state.retrying}
      />
    );
  }

  return (
    <CenteredEmptyState
      title="No discovery titles available"
      description="There are no upcoming, latest, or popular games to show right now."
    />
  );
}
