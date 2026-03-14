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
  errorMessage: string | null;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function useSearchTitlesQuery(query: string): SearchTitlesQueryState {
  const rawQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query).trim();
  const showSearchResults = debouncedQuery.length >= 2;

  const titlesQuery = useQuery({
    queryKey: ["titles", "search", debouncedQuery],
    enabled: showSearchResults && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }

      return apiClient.searchTitles({ query: debouncedQuery, signal });
    },
  });

  const results = titlesQuery.data?.results ?? [];

  if (rawQuery.length === 0) {
    return {
      mode: "idle",
      query: rawQuery,
      debouncedQuery,
      results: [],
      errorMessage: null,
    };
  }

  if (rawQuery.length < 2) {
    return {
      mode: "typing-too-short",
      query: rawQuery,
      debouncedQuery,
      results: [],
      errorMessage: null,
    };
  }

  if (apiClientConfigError) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: [],
      errorMessage: apiClientConfigError,
    };
  }

  if (showSearchResults && titlesQuery.isFetching && !titlesQuery.data) {
    return {
      mode: "loading",
      query: rawQuery,
      debouncedQuery,
      results: [],
      errorMessage: null,
    };
  }

  if (showSearchResults && titlesQuery.isError) {
    return {
      mode: "error",
      query: rawQuery,
      debouncedQuery,
      results: [],
      errorMessage: toErrorMessage(titlesQuery.error),
    };
  }

  if (!showSearchResults || results.length === 0) {
    return {
      mode: "empty",
      query: rawQuery,
      debouncedQuery,
      results,
      errorMessage: null,
    };
  }

  return {
    mode: "results",
    query: rawQuery,
    debouncedQuery,
    results,
    errorMessage: null,
  };
}
