import { API_PATH_PREFIX } from "@repo/config";
import type { HomeDiscoveryResult, TitleSummary } from "@repo/types";

import { isHomeDiscoveryResult } from "./payload-guards";
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
}: GetHomeDiscoveryRequestParams): Promise<HomeDiscoveryResult<TitleSummary>> {
  const homeBaseUrl = context.homeBaseUrl;
  const requestPath =
    homeBaseUrl == null ? `${API_PATH_PREFIX}/home/discovery` : "/home/discovery";

  return requestJson({
    context,
    baseUrl: homeBaseUrl,
    method: "GET",
    path: requestPath,
    signal: params?.signal,
    validate: isHomeDiscoveryResult,
    invalidPayloadMessage: "Home discovery payload is invalid.",
    failureMessage: "Home discovery request failed.",
  });
}
