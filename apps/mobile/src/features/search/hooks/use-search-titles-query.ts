import { useQuery } from "@tanstack/react-query";
import type { TitleSummary } from "@repo/types";

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
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
}

const SEARCH_PAGE_SIZE = 10;

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function useSearchTitlesQuery(
  query: string,
  limit: number = SEARCH_PAGE_SIZE,
): SearchTitlesQueryState {
  const rawQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query).trim();
  const showSearchResults = debouncedQuery.length >= 2;
  const normalizedLimit = Math.max(SEARCH_PAGE_SIZE, limit);
  const normalizedRawQuery = rawQuery.toLowerCase();
  const normalizedDebouncedQuery = debouncedQuery.toLowerCase();

  const titlesQuery = useQuery({
    queryKey: ["titles", "search", debouncedQuery, normalizedLimit],
    enabled: showSearchResults && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }

      return apiClient.searchTitles({
        query: debouncedQuery,
        limit: normalizedLimit,
        signal,
      });
    },
    placeholderData: (previousData) => previousData,
  });

  const results = titlesQuery.data?.results ?? [];
  const normalizedResolvedQuery = titlesQuery.data?.query.trim().toLowerCase() ?? "";
  const hasStaleQueryData =
    Boolean(titlesQuery.data) && normalizedResolvedQuery !== normalizedDebouncedQuery;
  const isTypingDifferentQuery =
    rawQuery.length >= 2 && normalizedRawQuery !== normalizedDebouncedQuery;
  const isLoadingMore =
    showSearchResults && titlesQuery.isFetching && results.length > 0;
  const hasMoreResults = showSearchResults && results.length >= normalizedLimit;

  if (rawQuery.length === 0) {
    return {
      mode: "idle",
      query: rawQuery,
      debouncedQuery,
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
      errorMessage: null,
    };
  }

  if (rawQuery.length < 2) {
    return {
      mode: "typing-too-short",
      query: rawQuery,
      debouncedQuery,
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
      errorMessage: null,
    };
  }

  if (apiClientConfigError) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
      errorMessage: apiClientConfigError,
    };
  }

  if (showSearchResults && titlesQuery.isFetching && !titlesQuery.data) {
    return {
      mode: "loading",
      query: rawQuery,
      debouncedQuery,
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
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
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
      errorMessage: null,
    };
  }

  if (showSearchResults && titlesQuery.isError) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: [],
      hasMoreResults: false,
      isLoadingMore: false,
      errorMessage: toErrorMessage(titlesQuery.error),
    };
  }

  if (!showSearchResults || results.length === 0) {
    return {
      mode: "empty",
      query: rawQuery,
      debouncedQuery,
      results,
      hasMoreResults: false,
      isLoadingMore,
      errorMessage: null,
    };
  }

  return {
    mode: "results",
    query: rawQuery,
    debouncedQuery,
    results,
    hasMoreResults,
    isLoadingMore,
    errorMessage: null,
  };
}
