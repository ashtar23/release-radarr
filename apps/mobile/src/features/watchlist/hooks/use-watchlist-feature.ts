import { useCallback, useMemo, useState } from "react";
import { match } from "ts-pattern";
import type { TitleDetails, WatchlistItem, WatchlistSort } from "@repo/types";

import { useAuthGate } from "@/auth/use-auth-gate";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";

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
  const { state: authGateState, isSignedIn } = useAuthGate();
  const { defaultWatchlistSort, isHydrated: arePreferencesHydrated } =
    useAppPreferences();
  const [selectedSort, setSelectedSort] = useState<WatchlistSort | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const resolvedDefaultSort = arePreferencesHydrated
    ? defaultWatchlistSort
    : DEFAULT_WATCHLIST_SORT;
  const sort = selectedSort ?? resolvedDefaultSort;
  const watchlistQuery = useWatchlistQuery(sort);
  const { addMutation, removeMutation } = useWatchlistMutation(sort);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { refetch } = watchlistQuery;

  const items =
    authGateState === "ready" && isSignedIn
      ? watchlistQuery.data?.items ?? EMPTY_WATCHLIST_ITEMS
      : EMPTY_WATCHLIST_ITEMS;
  const hasWatchlistData = watchlistQuery.data !== undefined;
  const canRefresh = authGateState === "ready" && isSignedIn;
  const isInitialLoading =
    watchlistQuery.isPending && !hasWatchlistData && !isManualRefreshing;
  const isMutating = addMutation.isPending || removeMutation.isPending;
  const isUpdatingSort =
    canRefresh &&
    watchlistQuery.isFetching &&
    watchlistQuery.isPlaceholderData &&
    !isManualRefreshing;
  const normalizedSearchQuery = normalizeWatchlistSearchText(searchQuery);

  const filteredItems = useMemo(() => {
    if (!normalizedSearchQuery) {
      return items;
    }

    return items.filter((item) =>
      normalizeWatchlistSearchText(item.title.name).includes(
        normalizedSearchQuery,
      ),
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
    authGateState,
    isManualRefreshing,
    hasWatchlistData,
    isInitialLoading,
  })
    .returnType<WatchlistScreenMode>()
    .with({ authGateState: "checking-session" }, () => "checking-session")
    .with({ authGateState: "signed-out" }, () => "signed-out")
    .with({ authGateState: "config-error" }, () => "loading")
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

  const updateSort = useCallback(
    (nextSort: WatchlistSort) => {
      setSelectedSort(nextSort === defaultWatchlistSort ? null : nextSort);
    },
    [defaultWatchlistSort],
  );

  const shouldShowControls = canRefresh && items.length > 0;

  return {
    items,
    filteredItems,
    sort,
    setSort: updateSort,
    searchQuery,
    setSearchQuery,
    shouldShowControls,
    mode,
    canUseWatchlist: isSignedIn,
    refreshing: isManualRefreshing && canRefresh,
    onRefresh: canRefresh ? refreshWatchlist : undefined,
    isMutating,
    isUpdatingSort,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  };
}

function normalizeWatchlistSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['’`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLocaleLowerCase()
    .trim();
}
