import type { TitleSearchResult, TitleSummary } from "@repo/types";

import {
  useSearchDebugSettings,
} from "@/features/search/debug/search-debug-settings";

import {
  SEARCH_MIN_QUERY_LENGTH,
  useSearchTitlesInfiniteQuery,
} from "./use-search-titles-infinite-query";

export type SearchStateMode =
  | "idle"
  | "typing-too-short"
  | "loading"
  | "error"
  | "empty"
  | "results";

const EMPTY_RESULTS: TitleSummary[] = [];
const noop = () => {};

export interface SearchScreenState {
  mode: SearchStateMode;
  query: string;
  debouncedQuery: string;
  results: TitleSummary[];
  totalCount: number;
  servedBy: TitleSearchResult["servedBy"] | null;
  decisionReason: TitleSearchResult["decisionReason"] | null;
  showSourceBadge: boolean;
  hasMoreResults: boolean;
  isLoadingMore: boolean;
  loadMoreErrorMessage: string | null;
  loadMoreResults: () => void;
  errorMessage: string | null;
}

export function useSearchScreenState(query: string): SearchScreenState {
  const { forceRawgRefresh, showSourceBadge } = useSearchDebugSettings();
  const queryState = useSearchTitlesInfiniteQuery(query, {
    forceRefresh: forceRawgRefresh,
  });

  if (queryState.query.length === 0) {
    return {
      mode: "idle",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (queryState.query.length < SEARCH_MIN_QUERY_LENGTH) {
    return {
      mode: "typing-too-short",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (queryState.configError) {
    return {
      mode: "error",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: queryState.configError,
    };
  }

  if (queryState.isFetchingInitial) {
    return {
      mode: "loading",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (
    queryState.isTypingDifferentQuery ||
    (queryState.isFetchingAny && queryState.hasStaleQueryData)
  ) {
    return {
      mode: "loading",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: null,
    };
  }

  if (queryState.hasInitialError) {
    return {
      mode: "error",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: EMPTY_RESULTS,
      totalCount: 0,
      servedBy: null,
      decisionReason: null,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: false,
      loadMoreErrorMessage: null,
      loadMoreResults: noop,
      errorMessage: queryState.initialErrorMessage,
    };
  }

  if (!queryState.showSearchResults || queryState.results.length === 0) {
    return {
      mode: "empty",
      query: queryState.query,
      debouncedQuery: queryState.debouncedQuery,
      results: queryState.results,
      totalCount: queryState.totalCount,
      servedBy: queryState.servedBy,
      decisionReason: queryState.decisionReason,
      showSourceBadge,
      hasMoreResults: false,
      isLoadingMore: queryState.isLoadingMore,
      loadMoreErrorMessage: queryState.loadMoreErrorMessage,
      loadMoreResults: queryState.loadMoreResults,
      errorMessage: null,
    };
  }

  return {
    mode: "results",
    query: queryState.query,
    debouncedQuery: queryState.debouncedQuery,
    results: queryState.results,
    totalCount: queryState.totalCount,
    servedBy: queryState.servedBy,
    decisionReason: queryState.decisionReason,
    showSourceBadge,
    hasMoreResults: queryState.hasMoreResults,
    isLoadingMore: queryState.isLoadingMore,
    loadMoreErrorMessage: queryState.loadMoreErrorMessage,
    loadMoreResults: queryState.loadMoreResults,
    errorMessage: null,
  };
}
