import React from "react";

import { CenteredConfigErrorState } from "@/components/centered-config-error-state";
import { CenteredEmptyState } from "@/components/centered-empty-state";
import { CenteredLoadingState } from "@/components/centered-loading-state";
import { CenteredRequestErrorState } from "@/components/centered-request-error-state";

import type { TitleDetailsScreenNonReadyState } from "../screen-state";

type TitleDetailsStateViewProps = {
  state: TitleDetailsScreenNonReadyState;
};

export function TitleDetailsStateView({ state }: TitleDetailsStateViewProps) {
  if (state.mode === "loading") {
    return (
      <CenteredLoadingState
        title="Loading title details..."
        description="Pulling the latest information for this game."
      />
    );
  }

  if (state.mode === "config-error") {
    return (
      <CenteredConfigErrorState
        title="Title details are unavailable"
        description={state.errorMessage}
        helpText="Check the title details API configuration for this build."
      />
    );
  }

  if (state.mode === "invalid-title") {
    return (
      <CenteredEmptyState
        title="Invalid title"
        description="This title could not be opened."
      />
    );
  }

  return (
    <CenteredRequestErrorState
      title="Couldn't load title details"
      description={state.errorMessage}
      onRetry={state.onRetry}
      retrying={state.retrying}
    />
  );
}
