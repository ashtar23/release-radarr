import type { WatchlistScreenMode } from "./use-watchlist-feature";
import { useWatchlistFeature } from "./use-watchlist-feature";

export function useWatchlistScreenState() {
  const watchlistFeature = useWatchlistFeature();

  return {
    mode: watchlistFeature.mode satisfies WatchlistScreenMode,
    items: watchlistFeature.items,
    refreshing: watchlistFeature.refreshing,
    onRefresh: watchlistFeature.onRefresh,
  };
}
