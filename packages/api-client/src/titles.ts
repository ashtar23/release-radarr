import { API_PATH_PREFIX } from "@repo/config";
import type { TitleDetailsResult } from "@repo/types";

import { isTitleDetailsResult } from "./payload-guards";
import { requestJson, type RequestContext } from "./request";

export interface GetTitleDetailsParams {
  readonly id: string;
  readonly signal?: AbortSignal;
}

interface GetTitleDetailsRequestParams {
  readonly context: RequestContext;
  readonly params: GetTitleDetailsParams;
}

export async function getTitleDetails({
  context,
  params,
}: GetTitleDetailsRequestParams): Promise<TitleDetailsResult> {
  const titlesBaseUrl = context.titlesBaseUrl;
  const normalizedId = params.id.trim();
  if (!normalizedId) {
    throw new Error("Title id is required.");
  }

  return requestJson({
    context,
    baseUrl: titlesBaseUrl,
    method: "GET",
    path:
      titlesBaseUrl == null
        ? `${API_PATH_PREFIX}/titles/${encodeURIComponent(normalizedId)}`
        : `/titles/${encodeURIComponent(normalizedId)}`,
    signal: params.signal,
    validate: isTitleDetailsResult,
    invalidPayloadMessage: "Title details payload is invalid.",
    failureMessage: "Title details request failed.",
  });
}
