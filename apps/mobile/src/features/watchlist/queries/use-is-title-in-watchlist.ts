import { useMemo } from "react";

import { useWatchlistQuery } from "./use-watchlist-query";

export function useIsTitleInWatchlist(titleId: string) {
  const { data: watchlistData, ...watchlistQuery } = useWatchlistQuery();
  const normalizedTitleId = titleId.trim();

  const isInWatchlist = useMemo(() => {
    if (!normalizedTitleId || !watchlistData?.items) {
      return false;
    }

    return watchlistData.items.some(
      (item) => item.title.id === normalizedTitleId,
    );
  }, [normalizedTitleId, watchlistData?.items]);

  return {
    isInWatchlist,
    watchlistQuery,
  };
}
