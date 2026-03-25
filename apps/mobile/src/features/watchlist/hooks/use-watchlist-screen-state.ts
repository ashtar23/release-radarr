import { useCallback, useState } from "react";
import { P, match } from "ts-pattern";

import { useAuth } from "@/auth/auth-provider";

import { useWatchlistQuery } from "../queries/use-watchlist-query";

export type WatchlistScreenMode =
  | "checking-session"
  | "signed-out"
  | "loading"
  | "refreshing"
  | "empty";

export function useWatchlistScreenState() {
  const { user, isReady } = useAuth();
  const watchlistQuery = useWatchlistQuery();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { refetch } = watchlistQuery;

  const items = watchlistQuery.data?.items ?? [];
  const hasWatchlistData = watchlistQuery.data !== undefined;
  const canRefresh = isReady && Boolean(user);
  const isInitialLoading =
    watchlistQuery.isPending && !hasWatchlistData && !isManualRefreshing;

  const refreshWatchlist = useCallback(async () => {
    if (isManualRefreshing) {
      return;
    }

    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isManualRefreshing, refetch]);

  const mode: WatchlistScreenMode = match({
    isReady,
    user,
    isManualRefreshing,
    hasWatchlistData,
    isInitialLoading,
  })
    .returnType<WatchlistScreenMode>()
    .with({ isReady: false }, () => "checking-session")
    .with({ user: P.nullish }, () => "signed-out")
    .with(
      { isManualRefreshing: true, hasWatchlistData: false },
      () => "refreshing",
    )
    .with({ isInitialLoading: true }, () => "loading")
    .otherwise(() => "empty");

  return {
    mode,
    items,
    refreshing: isManualRefreshing && canRefresh,
    onRefresh: canRefresh ? refreshWatchlist : undefined,
  };
}
