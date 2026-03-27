import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { TitleSearchResult, TitleSummary } from "@repo/types";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const SEARCH_MIN_QUERY_LENGTH = 2;
const SEARCH_PAGE_SIZE = 20;
const INITIAL_PAGE = 1;
const EMPTY_RESULTS: TitleSummary[] = [];

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function dedupeResults(results: TitleSummary[]) {
  const deduped: TitleSummary[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (seenIds.has(result.id)) {
      continue;
    }

    seenIds.add(result.id);
    deduped.push(result);
  }

  return deduped;
}

export interface SearchTitlesInfiniteQueryState {
  query: string;
  debouncedQuery: string;
  normalizedQuery: string;
  normalizedDebouncedQuery: string;
  showSearchResults: boolean;
  minQueryLength: number;
  results: TitleSummary[];
  totalCount: number;
  servedBy: TitleSearchResult["servedBy"] | null;
  decisionReason: TitleSearchResult["decisionReason"] | null;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMoreResults: () => void;
  isFetchingInitial: boolean;
  isFetchingAny: boolean;
  hasQueryData: boolean;
  hasStaleQueryData: boolean;
  isTypingDifferentQuery: boolean;
  hasInitialError: boolean;
  initialErrorMessage: string | null;
  configError: string | null;
}

export function useSearchTitlesInfiniteQuery(
  query: string,
  options: { forceRefresh?: boolean } = {},
): SearchTitlesInfiniteQueryState {
  const forceRefresh = options.forceRefresh ?? false;
  const rawQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query).trim();
  const showSearchResults = debouncedQuery.length >= SEARCH_MIN_QUERY_LENGTH;
  const normalizedQuery = rawQuery.toLowerCase();
  const normalizedDebouncedQuery = debouncedQuery.toLowerCase();

  const titlesQuery = useInfiniteQuery({
    queryKey: [
      "titles",
      "search",
      debouncedQuery,
      SEARCH_PAGE_SIZE,
      forceRefresh ? "force-refresh" : "default-refresh",
    ],
    enabled: showSearchResults && Boolean(apiClient),
    initialPageParam: INITIAL_PAGE,
    queryFn: ({ pageParam, signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }

      const page =
        typeof pageParam === "number" && pageParam >= 1
          ? pageParam
          : INITIAL_PAGE;

      return apiClient.searchTitles({
        query: debouncedQuery,
        page,
        limit: SEARCH_PAGE_SIZE,
        forceRefresh,
        signal,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore || lastPage.results.length === 0) {
        return undefined;
      }

      if (allPages.length > 1) {
        const previousResultIds = new Set(
          allPages.slice(0, -1).flatMap((page) => page.results.map((result) =>
            result.id
          )),
        );
        const addedUniqueResult = lastPage.results.some((result) =>
          !previousResultIds.has(result.id)
        );
        if (!addedUniqueResult) {
          return undefined;
        }
      }

      return lastPage.page + 1;
    },
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const pages = titlesQuery.data?.pages ?? [];
  const results = dedupeResults(pages.flatMap((page) => page.results));
  const totalCount = pages[0]?.totalCount ?? 0;
  const servedBy = pages[0]?.servedBy ?? null;
  const decisionReason = pages[0]?.decisionReason ?? null;
  const normalizedResolvedQuery = pages[0]?.query.trim().toLowerCase() ?? "";
  const hasQueryData = pages.length > 0;
  const hasStaleQueryData = hasQueryData &&
    normalizedResolvedQuery !== normalizedDebouncedQuery;
  const isTypingDifferentQuery =
    rawQuery.length >= SEARCH_MIN_QUERY_LENGTH &&
    normalizedQuery !== normalizedDebouncedQuery;
  const isLoadingMore = titlesQuery.isFetchingNextPage;
  const loadMoreErrorMessage = titlesQuery.isFetchNextPageError
    ? toErrorMessage(titlesQuery.error)
    : null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = titlesQuery;
  const hasMoreResults = Boolean(hasNextPage);
  const loadMoreResults = useCallback(() => {
    if (!showSearchResults || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, showSearchResults]);

  return {
    query: rawQuery,
    debouncedQuery,
    normalizedQuery,
    normalizedDebouncedQuery,
    showSearchResults,
    minQueryLength: SEARCH_MIN_QUERY_LENGTH,
    results: showSearchResults ? results : EMPTY_RESULTS,
    totalCount,
    servedBy,
    decisionReason,
    hasMoreResults,
    isLoadingMore,
    loadMoreErrorMessage,
    loadMoreResults,
    isFetchingInitial: showSearchResults && titlesQuery.isFetching && !titlesQuery.data,
    isFetchingAny: titlesQuery.isFetching,
    hasQueryData,
    hasStaleQueryData,
    isTypingDifferentQuery,
    hasInitialError: showSearchResults && titlesQuery.isError && !titlesQuery.data,
    initialErrorMessage: showSearchResults && titlesQuery.isError && !titlesQuery.data
      ? toErrorMessage(titlesQuery.error)
      : null,
    configError: apiClientConfigError ?? null,
  };
}
