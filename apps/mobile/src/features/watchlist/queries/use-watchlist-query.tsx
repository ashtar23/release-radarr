import { useAuth } from "@/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { listWatchlist, watchlistConfigError } from "../data-access/watchlist";

const WATCHLIST_STALE_TIME = 1000 * 60 * 5;

function useWatchlistQuery() {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["watchlist", userId],
    enabled: Boolean(userId) && watchlistConfigError === null && isReady,
    staleTime: WATCHLIST_STALE_TIME,
    queryFn: ({ signal }) => listWatchlist(signal),
  });
}

export { useWatchlistQuery };
