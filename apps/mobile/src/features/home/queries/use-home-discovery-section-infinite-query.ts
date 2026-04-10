import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { TitleSummary } from "@repo/types";

import { extractErrorMessage } from "@/lib/extract-error-message";

import {
  createHomeDiscoveryPageQueryFn,
  homeDiscoveryPageConfigError,
} from "../data-access/home-discovery-page";
import type { HomeDiscoverySectionKey } from "../home-discovery-sections";

const HOME_DISCOVERY_PAGE_SIZE = 20;
const EMPTY_ITEMS: TitleSummary[] = [];

function dedupeTitles(items: TitleSummary[]) {
  const seenIds = new Set<string>();
  const deduped: TitleSummary[] = [];

  for (const item of items) {
    if (seenIds.has(item.id)) {
      continue;
    }

    seenIds.add(item.id);
    deduped.push(item);
  }

  return deduped;
}

export interface HomeDiscoverySectionInfiniteQueryState {
  items: TitleSummary[];
  hasAnyItems: boolean;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  isFetchingInitial: boolean;
  isFetchingAny: boolean;
  hasInitialError: boolean;
  initialErrorMessage: string | null;
  loadMoreErrorMessage: string | null;
  configError: string | null;
  loadMoreResults: () => void;
  refetchSection: () => void;
}

export function useHomeDiscoverySectionInfiniteQuery(
  section: HomeDiscoverySectionKey,
): HomeDiscoverySectionInfiniteQueryState {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["home", "discovery", "section", section, HOME_DISCOVERY_PAGE_SIZE],
    enabled: homeDiscoveryPageConfigError === null,
    initialPageParam: null,
    queryFn: createHomeDiscoveryPageQueryFn({
      section,
      limit: HOME_DISCOVERY_PAGE_SIZE,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const items = useMemo(
    () => dedupeTitles((data?.pages ?? []).flatMap((page) => page.items)),
    [data],
  );

  const loadMoreResults = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    items: items.length > 0 ? items : EMPTY_ITEMS,
    hasAnyItems: items.length > 0,
    hasMoreResults: Boolean(hasNextPage),
    isLoadingMore: isFetchingNextPage,
    isFetchingInitial: isFetching && !data,
    isFetchingAny: isFetching,
    hasInitialError: isError && !data,
    initialErrorMessage:
      isError && !data
        ? extractErrorMessage(error, "Could not load this discovery section.")
        : null,
    loadMoreErrorMessage: isFetchNextPageError
      ? extractErrorMessage(error, "Could not load more titles.")
      : null,
    configError: homeDiscoveryPageConfigError,
    loadMoreResults,
    refetchSection: () => {
      void refetch();
    },
  };
}
