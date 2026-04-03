import { useCallback, useMemo, useState } from "react";
import type { TitleDetails, WatchlistItem, WatchlistSort } from "@repo/types";

import { useAuthGate } from "@/auth/use-auth-gate";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { extractErrorMessage } from "@/lib/extract-error-message";

import { DEFAULT_WATCHLIST_SORT } from "../watchlist-sort";
import { useWatchlistMutation } from "../mutations/use-watchlist-mutation";
import { watchlistConfigError } from "../data-access/watchlist";
import { useWatchlistQuery } from "../queries/use-watchlist-query";
import {
  deriveWatchlistScreenState,
  type WatchlistScreenReadyState,
} from "../screen-state";

const EMPTY_WATCHLIST_ITEMS: WatchlistItem[] = [];

export function useWatchlistScreen() {
  const {
    state: authGateState,
    isSignedIn,
    configError: authConfigError,
  } = useAuthGate();
  const { defaultWatchlistSort, isHydrated: arePreferencesHydrated } =
    useAppPreferences();

  const [selectedSort, setSelectedSort] = useState<WatchlistSort | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const resolvedDefaultSort = arePreferencesHydrated
    ? defaultWatchlistSort
    : DEFAULT_WATCHLIST_SORT;

  const sort = selectedSort ?? resolvedDefaultSort;

  const {
    data: watchlistData,
    error: watchlistError,
    isError: hasWatchlistError,
    isFetching,
    isPending,
    isPlaceholderData,
    refetch: refetchWatchlist,
  } = useWatchlistQuery(sort);

  const { addMutation, removeMutation } = useWatchlistMutation(sort);

  const configError = authConfigError ?? watchlistConfigError;
  const canRefresh = authGateState === "ready" && isSignedIn;
  const items =
    authGateState === "ready" && isSignedIn
      ? (watchlistData?.items ?? EMPTY_WATCHLIST_ITEMS)
      : EMPTY_WATCHLIST_ITEMS;
  const hasWatchlistData = watchlistData !== undefined;
  const isInitialLoading =
    isPending && !hasWatchlistData && !isManualRefreshing;
  const hasBlockingRequestError = !hasWatchlistData && hasWatchlistError;

  const requestErrorMessage = extractErrorMessage(
    watchlistError,
    "Something went wrong while loading your watchlist.",
  );
  const isMutating = addMutation.isPending || removeMutation.isPending;
  const isUpdatingSort =
    canRefresh && isFetching && isPlaceholderData && !isManualRefreshing;
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
      await refetchWatchlist();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [isManualRefreshing, refetchWatchlist]);

  const retryWatchlist = useCallback(() => {
    void refreshWatchlist();
  }, [refreshWatchlist]);

  const trimmedSearchQuery = searchQuery.trim();
  const readyState: WatchlistScreenReadyState = {
    mode: "ready",
    items,
    filteredItems,
    refreshing: isManualRefreshing && canRefresh,
    onRefresh: canRefresh ? retryWatchlist : undefined,
  };

  const state = deriveWatchlistScreenState({
    authGateState,
    configError,
    isInitialLoading,
    hasBlockingRequestError,
    requestErrorMessage,
    itemsCount: items.length,
    hasSearchQuery: trimmedSearchQuery.length > 0,
    searchQuery: trimmedSearchQuery,
    filteredItemsCount: filteredItems.length,
    readyState,
    retrying: isManualRefreshing,
    onRetry: canRefresh ? retryWatchlist : undefined,
  });

  const isInWatchlist = useCallback(
    (titleId: string) => {
      const normalizedTitleId = titleId.trim();
      if (!normalizedTitleId) {
        return false;
      }

      return items.some((item) => item.title.id === normalizedTitleId);
    },
    [items],
  );

  const addToWatchlist = useCallback(
    (title: TitleDetails) => {
      addMutation.mutate({ title });
    },
    [addMutation],
  );

  const removeFromWatchlist = useCallback(
    (titleId: string) => {
      removeMutation.mutate({ titleId });
    },
    [removeMutation],
  );

  const updateSort = useCallback(
    (nextSort: WatchlistSort) => {
      setSelectedSort(nextSort === defaultWatchlistSort ? null : nextSort);
    },
    [defaultWatchlistSort],
  );

  const shouldShowControls =
    canRefresh && (state.mode === "ready" || state.mode === "search-empty");

  return {
    state,
    sort,
    setSort: updateSort,
    setSearchQuery,
    shouldShowControls,
    canUseWatchlist: isSignedIn,
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
