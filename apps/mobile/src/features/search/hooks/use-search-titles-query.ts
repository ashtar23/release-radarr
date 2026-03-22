import { useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { TitleSearchResult, TitleSummary } from "@repo/types";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export type SearchStateMode =
  | "idle"
  | "typing-too-short"
  | "loading"
  | "error"
  | "empty"
  | "results";

export interface SearchTitlesQueryState {
  mode: SearchStateMode;
  query: string;
  debouncedQuery: string;
  results: TitleSummary[];
  totalCount: number;
  servedBy: TitleSearchResult["servedBy"] | null;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMoreResults: () => void;
  errorMessage: string | null;
}

const SEARCH_PAGE_SIZE = 20;
const INITIAL_PAGE = 1;
const EMPTY_RESULTS: TitleSummary[] = [];
const noop = () => {};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function useSearchTitlesQuery(
  query: string,
): SearchTitlesQueryState {
  const rawQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query).trim();
  const showSearchResults = debouncedQuery.length >= 2;
  const normalizedRawQuery = rawQuery.toLowerCase();
  const normalizedDebouncedQuery = debouncedQuery.toLowerCase();

  const titlesQuery = useInfiniteQuery({
    queryKey: ["titles", "search", debouncedQuery, SEARCH_PAGE_SIZE],
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
        signal,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    retry: 1,
  });

  const pages = titlesQuery.data?.pages ?? [];
  const results = dedupeResults(pages.flatMap((page) => page.results));
  const totalCount = pages[0]?.totalCount ?? 0;
  const servedBy = pages[0]?.servedBy ?? null;
  const normalizedResolvedQuery = pages[0]?.query.trim().toLowerCase() ?? "";
  const hasStaleQueryData = pages.length > 0 &&
    normalizedResolvedQuery !== normalizedDebouncedQuery;
  const isTypingDifferentQuery =
    rawQuery.length >= 2 && normalizedRawQuery !== normalizedDebouncedQuery;
  const latestPage = pages.at(-1);
  const hasMoreResults = Boolean(latestPage?.hasMore);
  const isLoadingMore = titlesQuery.isFetchingNextPage;
  const loadMoreErrorMessage = titlesQuery.isFetchNextPageError
    ? toErrorMessage(titlesQuery.error)
    : null;
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = titlesQuery;
  const loadMoreResults = useCallback(() => {
    if (!showSearchResults || !hasNextPage) return;
    if (isFetchingNextPage) return;
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    showSearchResults,
  ]);

  if (rawQuery.length === 0) {
    return {
      mode: "idle",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (rawQuery.length < 2) {
    return {
      mode: "typing-too-short",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (apiClientConfigError) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: apiClientConfigError,
    };
  }

  if (showSearchResults && titlesQuery.isFetching && !titlesQuery.data) {
    return {
      mode: "loading",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (
    isTypingDifferentQuery ||
    (showSearchResults && titlesQuery.isFetching && hasStaleQueryData)
  ) {
    return {
      mode: "loading",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (showSearchResults && titlesQuery.isError && !titlesQuery.data) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: toErrorMessage(titlesQuery.error),
    };
  }

  if (!showSearchResults || results.length === 0) {
    return {
      mode: "empty",
      query: rawQuery,
      debouncedQuery,
      results,
      totalCount,
      servedBy,
      hasMoreResults: false,
      isLoadingMore,
      loadMoreErrorMessage,
      loadMoreResults,
      errorMessage: null,
    };
  }

  return {
    mode: "results",
    query: rawQuery,
    debouncedQuery,
    results,
    totalCount,
    servedBy,
    hasMoreResults,
    isLoadingMore,
    loadMoreErrorMessage,
    loadMoreResults,
    errorMessage: null,
  };
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
