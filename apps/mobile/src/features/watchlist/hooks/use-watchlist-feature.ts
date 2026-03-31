import { useCallback, useMemo, useState } from "react";
import { P, match } from "ts-pattern";
import type { TitleDetails, WatchlistItem, WatchlistSort } from "@repo/types";

import { useAuth } from "@/auth/auth-provider";

import { DEFAULT_WATCHLIST_SORT } from "../watchlist-sort";
import { useWatchlistMutation } from "../queries/use-watchlist-mutation";
import { useWatchlistQuery } from "../queries/use-watchlist-query";

export type WatchlistScreenMode =
  | "checking-session"
  | "signed-out"
  | "loading"
  | "refreshing"
  | "empty";

const EMPTY_WATCHLIST_ITEMS: WatchlistItem[] = [];

export function useWatchlistFeature() {
  const { user, isReady } = useAuth();
  const [sort, setSort] = useState<WatchlistSort>(DEFAULT_WATCHLIST_SORT);
  const [searchQuery, setSearchQuery] = useState("");
  const watchlistQuery = useWatchlistQuery(sort);
  const { addMutation, removeMutation } = useWatchlistMutation(sort);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { refetch } = watchlistQuery;

  const items = watchlistQuery.data?.items ?? EMPTY_WATCHLIST_ITEMS;
  const hasWatchlistData = watchlistQuery.data !== undefined;
  const canRefresh = isReady && Boolean(user);
  const isInitialLoading =
    watchlistQuery.isPending && !hasWatchlistData && !isManualRefreshing;
  const isMutating = addMutation.isPending || removeMutation.isPending;
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return items;
    }

    return items.filter((item) =>
      item.title.name.toLocaleLowerCase().includes(normalizedSearchQuery),
    );
  }, [items, normalizedSearchQuery]);

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

  const isInWatchlist = (titleId: string) => {
    const normalizedTitleId = titleId.trim();
    if (!normalizedTitleId) {
      return false;
    }

    return items.some((item) => item.title.id === normalizedTitleId);
  };

  const addToWatchlist = (title: TitleDetails) => {
    addMutation.mutate({ title });
  };

  const removeFromWatchlist = (titleId: string) => {
    removeMutation.mutate({ titleId });
  };

  return {
    items,
    filteredItems,
    sort,
    setSort,
    searchQuery,
    setSearchQuery,
    mode,
    canUseWatchlist: Boolean(user),
    refreshing: isManualRefreshing && canRefresh,
    onRefresh: canRefresh ? refreshWatchlist : undefined,
    isMutating,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  };
}
