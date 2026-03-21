import { API_PATH_PREFIX } from "@repo/config";
import type { TitleDetails } from "@repo/types";

import { isTitleDetails } from "./payload-guards";
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
}: GetTitleDetailsRequestParams): Promise<TitleDetails> {
  const normalizedId = params.id.trim();
  if (!normalizedId) {
    throw new Error("Title id is required.");
  }

  return requestJson({
    context,
    method: "GET",
    path: `${API_PATH_PREFIX}/titles/${encodeURIComponent(normalizedId)}`,
    signal: params.signal,
    validate: isTitleDetails,
    invalidPayloadMessage: "Title details payload is invalid.",
    failureMessage: "Title details request failed.",
  });
}
