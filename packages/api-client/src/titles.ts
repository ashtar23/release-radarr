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
  const normalizedId = params.id.trim();
  if (!normalizedId) {
    throw new Error("Title id is required.");
  }

  return requestJson({
    context,
    method: "GET",
    path: `/titles/${encodeURIComponent(normalizedId)}`,
    signal: params.signal,
    validate: isTitleDetailsResult,
    invalidPayloadMessage: "Title details payload is invalid.",
    failureMessage: "Title details request failed.",
  });
}
