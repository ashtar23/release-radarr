import type { TitleDetails } from "@repo/types";

export type TitleDetailsScreenReadyState = {
  mode: "ready";
  details: TitleDetails;
};

export type TitleDetailsScreenNonReadyState =
  | {
      mode: "config-error";
      errorMessage: string;
    }
  | { mode: "invalid-title" }
  | { mode: "loading" }
  | {
      mode: "request-error";
      errorMessage: string;
      onRetry?: () => void;
      retrying: boolean;
    };

export type TitleDetailsScreenState =
  | TitleDetailsScreenNonReadyState
  | TitleDetailsScreenReadyState;
