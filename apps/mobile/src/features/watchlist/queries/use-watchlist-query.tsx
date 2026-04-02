import type { WatchlistSort } from "@repo/types";
import { useAuth } from "@/auth/auth-provider";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listWatchlist, watchlistConfigError } from "../data-access/watchlist";
import { getWatchlistQueryKey } from "./watchlist-query-key";

const WATCHLIST_STALE_TIME = 1000 * 60 * 5;

function useWatchlistQuery(sort: WatchlistSort) {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: getWatchlistQueryKey(userId, sort),
    enabled: Boolean(userId) && watchlistConfigError === null && isReady,
    placeholderData: keepPreviousData,
    staleTime: WATCHLIST_STALE_TIME,
    queryFn: ({ signal }) => listWatchlist({ signal, sort }),
  });
}

export { useWatchlistQuery };
