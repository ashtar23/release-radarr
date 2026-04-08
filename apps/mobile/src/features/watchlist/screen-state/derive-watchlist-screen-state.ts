import type { AuthGateState } from "@/auth/use-auth-gate";

import type { WatchlistScreenReadyState, WatchlistScreenState } from "./types";

const WATCHLIST_CONFIG_ERROR_MESSAGE =
  "Watchlist configuration is unavailable.";

type DeriveWatchlistScreenStateInput = {
  authGateState: AuthGateState;
  configError: string | null;
  isInitialLoading: boolean;
  hasBlockingRequestError: boolean;
  requestErrorMessage: string;
  itemsCount: number;
  hasSearchQuery: boolean;
  searchQuery: string;
  filteredItemsCount: number;
  readyState: WatchlistScreenReadyState;
  retrying: boolean;
  onRetry?: () => void;
};

export function deriveWatchlistScreenState({
  authGateState,
  configError,
  isInitialLoading,
  hasBlockingRequestError,
  requestErrorMessage,
  itemsCount,
  hasSearchQuery,
  searchQuery,
  filteredItemsCount,
  readyState,
  retrying,
  onRetry,
}: DeriveWatchlistScreenStateInput): WatchlistScreenState {
  const isConfigError = authGateState === "config-error" || configError != null;

  if (authGateState === "signed-out") {
    return { mode: "signed-out" };
  }

  if (isConfigError) {
    return {
      mode: "config-error",
      errorMessage: configError ?? WATCHLIST_CONFIG_ERROR_MESSAGE,
    };
  }

  if (authGateState === "checking-session" || isInitialLoading) {
    return { mode: "loading" };
  }

  if (hasBlockingRequestError) {
    return {
      mode: "request-error",
      errorMessage: requestErrorMessage,
      onRetry,
      retrying,
    };
  }

  if (filteredItemsCount === 0 && hasSearchQuery) {
    return { mode: "search-empty", searchQuery };
  }

  if (itemsCount === 0) {
    return { mode: "empty" };
  }

  return readyState;
}
