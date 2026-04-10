import type {
  HomeDiscoveryLatestPageResponse,
  HomeDiscoveryPopularPageResponse,
  HomeDiscoveryUpcomingPageResponse,
} from "@repo/api-client";

import { apiClient, apiClientConfigError } from "@/lib/api-client";

import type { HomeDiscoverySectionKey } from "../home-discovery-sections";

export const homeDiscoveryPageConfigError = apiClientConfigError;

export interface HomeDiscoveryPageParams {
  readonly section: HomeDiscoverySectionKey;
  readonly cursor?: string;
  readonly limit: number;
  readonly signal?: AbortSignal;
}

export type HomeDiscoveryPageResponse =
  | HomeDiscoveryUpcomingPageResponse
  | HomeDiscoveryLatestPageResponse
  | HomeDiscoveryPopularPageResponse;

export async function listHomeDiscoveryPage({
  section,
  cursor,
  limit,
  signal,
}: HomeDiscoveryPageParams): Promise<HomeDiscoveryPageResponse> {
  if (!apiClient) {
    throw new Error(
      homeDiscoveryPageConfigError ?? "Home discovery API is not configured.",
    );
  }

  switch (section) {
    case "upcoming":
      return apiClient.listHomeDiscoveryUpcomingPage({ cursor, limit, signal });
    case "latest":
      return apiClient.listHomeDiscoveryLatestPage({ cursor, limit, signal });
    case "popular":
      return apiClient.listHomeDiscoveryPopularPage({ cursor, limit, signal });
  }
}

export function createHomeDiscoveryPageQueryFn(params: {
  section: HomeDiscoverySectionKey;
  limit: number;
}) {
  return ({
    pageParam,
    signal,
  }: {
    pageParam: unknown;
    signal?: AbortSignal;
  }) =>
    listHomeDiscoveryPage({
      section: params.section,
      cursor: normalizePageCursor(pageParam),
      limit: params.limit,
      signal,
    });
}

function normalizePageCursor(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}
