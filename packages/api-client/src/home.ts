import type {
  HomeDiscoveryLatestPageResponse,
  HomeDiscoveryPopularPageResponse,
  HomeDiscoveryResponse,
  HomeDiscoveryUpcomingPageResponse,
} from "./openapi-types";
import { openApiGet } from "./openapi-client";
import type { RequestContext } from "./request";

export interface GetHomeDiscoveryParams {
  readonly signal?: AbortSignal;
}

export interface ListHomeDiscoveryPageParams {
  readonly cursor?: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

interface GetHomeDiscoveryRequestParams {
  readonly context: RequestContext;
  readonly params?: GetHomeDiscoveryParams;
}

export async function getHomeDiscovery({
  context,
  params,
}: GetHomeDiscoveryRequestParams): Promise<HomeDiscoveryResponse> {
  return openApiGet({
    context,
    path: "/home/discovery",
    signal: params?.signal,
    failureMessage: "Home discovery request failed.",
  });
}

export async function listHomeDiscoveryUpcomingPage({
  context,
  params,
}: {
  readonly context: RequestContext;
  readonly params?: ListHomeDiscoveryPageParams;
}): Promise<HomeDiscoveryUpcomingPageResponse> {
  return openApiGet({
    context,
    path: "/home/discovery/upcoming",
    query: {
      cursor: params?.cursor,
      limit: params?.limit == null ? undefined : String(params.limit),
    },
    signal: params?.signal,
    failureMessage: "Upcoming discovery page request failed.",
  });
}

export async function listHomeDiscoveryLatestPage({
  context,
  params,
}: {
  readonly context: RequestContext;
  readonly params?: ListHomeDiscoveryPageParams;
}): Promise<HomeDiscoveryLatestPageResponse> {
  return openApiGet({
    context,
    path: "/home/discovery/latest",
    query: {
      cursor: params?.cursor,
      limit: params?.limit == null ? undefined : String(params.limit),
    },
    signal: params?.signal,
    failureMessage: "Latest discovery page request failed.",
  });
}

export async function listHomeDiscoveryPopularPage({
  context,
  params,
}: {
  readonly context: RequestContext;
  readonly params?: ListHomeDiscoveryPageParams;
}): Promise<HomeDiscoveryPopularPageResponse> {
  return openApiGet({
    context,
    path: "/home/discovery/popular",
    query: {
      cursor: params?.cursor,
      limit: params?.limit == null ? undefined : String(params.limit),
    },
    signal: params?.signal,
    failureMessage: "Popular discovery page request failed.",
  });
}
