import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const searchConfigError = apiClientConfigError;

type SearchTitlesPageParams = {
  query: string;
  page: number;
  limit: number;
  forceRefresh: boolean;
  signal?: AbortSignal;
};

type SearchTitlesPageQueryFnOptions = {
  query: string;
  limit: number;
  forceRefresh: boolean;
  initialPage?: number;
};

export function searchTitlesPage({
  query,
  page,
  limit,
  forceRefresh,
  signal,
}: SearchTitlesPageParams) {
  if (!apiClient) {
    throw new Error(searchConfigError ?? "Search API is not configured.");
  }

  return apiClient.searchTitles({
    query,
    page,
    limit,
    forceRefresh,
    signal,
  });
}

export function createSearchTitlesPageQueryFn({
  query,
  limit,
  forceRefresh,
  initialPage = 1,
}: SearchTitlesPageQueryFnOptions) {
  return ({
    pageParam,
    signal,
  }: {
    pageParam: unknown;
    signal?: AbortSignal;
  }) =>
    searchTitlesPage({
      query,
      page: normalizeSearchPageParam(pageParam, initialPage),
      limit,
      forceRefresh,
      signal,
    });
}

function normalizeSearchPageParam(value: unknown, fallbackPage: number) {
  if (typeof value === "number" && value >= 1) {
    return value;
  }

  return fallbackPage;
}
