import { useMemo } from "react";

import { extractErrorMessage } from "@/lib/extract-error-message";
import { apiClientConfigError } from "@/lib/api-client";

import { useHomeDiscoveryQuery } from "../queries/use-home-discovery-query";
import {
  deriveHomeScreenState,
  type HomeScreenReadyState,
} from "../screen-state";

export function useHomeScreen() {
  const discoveryQuery = useHomeDiscoveryQuery();
  const {
    data: discovery,
    error,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = discoveryQuery;

  const hasAnySection = useMemo(
    () =>
      (discovery?.upcoming.length ?? 0) > 0 ||
      (discovery?.latest.length ?? 0) > 0 ||
      (discovery?.popular.length ?? 0) > 0,
    [discovery],
  );

  const readyState: HomeScreenReadyState = {
    mode: "ready",
    discovery: discovery ?? { upcoming: [], latest: [], popular: [] },
  };

  const state = deriveHomeScreenState({
    configError: apiClientConfigError,
    isInitialLoading: isPending,
    hasBlockingRequestError: isError,
    requestErrorMessage: extractErrorMessage(
      error,
      "Something went wrong while loading discovery.",
    ),
    onRetry: () => {
      void refetch();
    },
    retrying: isRefetching,
    hasAnySection,
    readyState,
  });

  return { state };
}
