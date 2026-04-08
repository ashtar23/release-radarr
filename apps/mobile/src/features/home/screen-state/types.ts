import type { HomeDiscoveryResult, TitleSummary } from "@repo/types";

export type HomeDiscoveryData = HomeDiscoveryResult<TitleSummary>;

export type HomeScreenReadyState = {
  mode: "ready";
  discovery: HomeDiscoveryData;
};

export type HomeScreenNonReadyState =
  | {
      mode: "config-error";
      errorMessage: string;
    }
  | { mode: "loading" }
  | {
      mode: "request-error";
      errorMessage: string;
      onRetry?: () => void;
      retrying: boolean;
    }
  | { mode: "empty" };

export type HomeScreenState = HomeScreenNonReadyState | HomeScreenReadyState;
