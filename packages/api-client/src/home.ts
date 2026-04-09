import type { HomeDiscoveryResponse } from "./openapi-types";
import { openApiGet } from "./openapi-client";
import type { RequestContext } from "./request";

export interface GetHomeDiscoveryParams {
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
