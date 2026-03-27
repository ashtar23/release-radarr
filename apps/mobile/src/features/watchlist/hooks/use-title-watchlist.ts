import type { TitleDetails } from "@repo/types";

import { useWatchlistFeature } from "./use-watchlist-feature";

export function useTitleWatchlist(
  titleId: string,
  titleDetails?: TitleDetails,
) {
  const watchlistFeature = useWatchlistFeature();
  const isInWatchlist = watchlistFeature.isInWatchlist(titleId);
  const canToggleWatchlist = isInWatchlist || Boolean(titleDetails);

  const toggleWatchlist = () => {
    if (isInWatchlist) {
      watchlistFeature.removeFromWatchlist(titleId);
      return;
    }

    if (titleDetails) {
      watchlistFeature.addToWatchlist(titleDetails);
    }
  };

  return {
    isInWatchlist,
    canToggleWatchlist,
    isMutating: watchlistFeature.isMutating,
    toggleWatchlist,
  };
}
