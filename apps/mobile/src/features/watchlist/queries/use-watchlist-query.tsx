import type { WatchlistListResult, WatchlistSort } from "@repo/types";
import { useAuth } from "@/auth/auth-provider";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  getWatchlistMembership,
  listWatchlist,
  watchlistConfigError,
} from "../data-access/watchlist";
import {
  getWatchlistListQueryKey,
  getWatchlistMembershipQueryKey,
} from "./watchlist-query-key";

const WATCHLIST_STALE_TIME = 1000 * 60 * 5;
const WATCHLIST_PAGE_SIZE = 20;

function useWatchlistQuery(sort: WatchlistSort, query: string) {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useInfiniteQuery<WatchlistListResult>({
    queryKey: getWatchlistListQueryKey(userId, sort, query),
    enabled: Boolean(userId) && watchlistConfigError === null && isReady,
    initialPageParam: null as string | null,
    placeholderData: keepPreviousData,
    staleTime: WATCHLIST_STALE_TIME,
    queryFn: async ({ pageParam, signal }) => {
      const cursor = typeof pageParam === "string" ? pageParam : undefined;

      const result = await listWatchlist({
        signal,
        sort,
        query,
        cursor,
        limit: WATCHLIST_PAGE_SIZE,
      });

      return result;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

function useWatchlistMembershipQuery(titleId: string) {
  const { user, isReady } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: getWatchlistMembershipQueryKey(userId, titleId),
    enabled:
      titleId.trim().length > 0 &&
      Boolean(userId) &&
      watchlistConfigError === null &&
      isReady,
    staleTime: WATCHLIST_STALE_TIME,
    queryFn: ({ signal }) => getWatchlistMembership({ titleId, signal }),
  });
}

export { WATCHLIST_PAGE_SIZE, useWatchlistQuery, useWatchlistMembershipQuery };
