import type { WatchlistItem } from "@repo/types";

export type WatchlistScreenReadyState = {
  mode: "ready";
  items: WatchlistItem[];
  filteredItems: WatchlistItem[];
  refreshing: boolean;
  onRefresh?: () => void;
};

export type WatchlistScreenNonReadyState =
  | { mode: "signed-out" }
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
  | { mode: "empty" }
  | { mode: "search-empty"; searchQuery: string };

export type WatchlistScreenState =
  | WatchlistScreenNonReadyState
  | WatchlistScreenReadyState;
