import type { HomeDiscoveryResponse } from "./openapi-types";
import { requestJson, type RequestContext } from "./request";

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
  return requestJson<HomeDiscoveryResponse>({
    context,
    method: "GET",
    path: "/home/discovery",
    signal: params?.signal,
    failureMessage: "Home discovery request failed.",
  });
}
