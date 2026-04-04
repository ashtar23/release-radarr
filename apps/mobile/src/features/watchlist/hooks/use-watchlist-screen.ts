import { useCallback, useState } from "react";
import type { TitleDetails, WatchlistItem, WatchlistSort } from "@repo/types";

import { useAuthGate } from "@/auth/use-auth-gate";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { useManualRefresh } from "@/hooks/use-manual-refresh";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { useIsOffline } from "@/lib/react-query-online";

import { DEFAULT_WATCHLIST_SORT } from "../watchlist-sort";
import { useWatchlistMutation } from "../mutations/use-watchlist-mutation";
import { watchlistConfigError } from "../data-access/watchlist";
import { useWatchlistQuery } from "../queries/use-watchlist-query";
import { useWatchlistSearch } from "./use-watchlist-search";
import {
  deriveWatchlistScreenState,
  type WatchlistScreenReadyState,
} from "../screen-state";

const EMPTY_WATCHLIST_ITEMS: WatchlistItem[] = [];

export function useWatchlistScreen() {
  const isOffline = useIsOffline();
  const {
    state: authGateState,
    isSignedIn,
    configError: authConfigError,
  } = useAuthGate();
  const { defaultWatchlistSort, isHydrated: arePreferencesHydrated } =
    useAppPreferences();

  const [selectedSort, setSelectedSort] = useState<WatchlistSort | null>(null);
  const { setSearchQuery, trimmedSearchQuery, debouncedSearchQuery } =
    useWatchlistSearch();

  const resolvedDefaultSort = arePreferencesHydrated
    ? defaultWatchlistSort
    : DEFAULT_WATCHLIST_SORT;

  const sort = selectedSort ?? resolvedDefaultSort;

  const {
    data: watchlistData,
    error: watchlistError,
    isError: hasWatchlistError,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isPending,
    isRefetching,
    refetch: refetchWatchlist,
  } = useWatchlistQuery(sort, debouncedSearchQuery);

  const { addMutation, removeMutation } = useWatchlistMutation();

  const configError = authConfigError ?? watchlistConfigError;
  const canRefresh = authGateState === "ready" && isSignedIn;
  const items =
    authGateState === "ready" && isSignedIn
      ? (watchlistData?.pages.flatMap((page) => page.items) ??
        EMPTY_WATCHLIST_ITEMS)
      : EMPTY_WATCHLIST_ITEMS;
  const hasWatchlistData = watchlistData !== undefined;
  const {
    isRefreshing: isManualRefreshing,
    canRefresh: canManualRefresh,
    refresh: refreshWatchlist,
  } = useManualRefresh({
    enabled: canRefresh,
    hasData: hasWatchlistData,
    isOffline,
    refreshAction: refetchWatchlist,
  });
  const isInitialLoading =
    isPending && !hasWatchlistData && !isManualRefreshing;
  const requestErrorMessage = extractErrorMessage(
    watchlistError,
    "Something went wrong while loading your watchlist.",
  );
  const hasBlockingRequestError = !hasWatchlistData && hasWatchlistError;
  const isMutating = addMutation.isPending || removeMutation.isPending;
  const filteredItems = items;

  const retryWatchlist = useCallback(() => {
    void refreshWatchlist();
  }, [refreshWatchlist]);

  const loadMoreItems = useCallback(() => {
    if (isOffline || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOffline]);
  const readyState: WatchlistScreenReadyState = {
    mode: "ready",
    items,
    filteredItems,
    refreshing: isManualRefreshing && canRefresh,
    onRefresh: canManualRefresh ? retryWatchlist : undefined,
    hasMoreItems: !isOffline && Boolean(hasNextPage),
    isLoadingMore: isFetchingNextPage,
    loadMoreItems,
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
    retrying: !hasWatchlistData && isRefetching,
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
      if (isOffline) {
        return;
      }

      setSelectedSort(nextSort === defaultWatchlistSort ? null : nextSort);
    },
    [defaultWatchlistSort, isOffline],
  );

  const shouldShowControls =
    !isOffline &&
    canRefresh &&
    (state.mode === "ready" || state.mode === "search-empty");
  const showLoadingOverlay =
    isPlaceholderData &&
    isFetching &&
    !isFetchingNextPage &&
    hasWatchlistData &&
    !isManualRefreshing;

  return {
    state,
    retry: retryWatchlist,
    retrying: !hasWatchlistData && isRefetching,
    sort,
    setSort: updateSort,
    setSearchQuery,
    shouldShowControls,
    showLoadingOverlay,
    canUseWatchlist: isSignedIn,
    isMutating,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  };
}
