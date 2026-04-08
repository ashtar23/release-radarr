import type { TitleDetailsResponse } from "./openapi-types";
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
}: GetTitleDetailsRequestParams): Promise<TitleDetailsResponse> {
  const normalizedId = params.id.trim();
  if (!normalizedId) {
    throw new Error("Title id is required.");
  }

  return requestJson<TitleDetailsResponse>({
    context,
    method: "GET",
    path: `/titles/${encodeURIComponent(normalizedId)}`,
    signal: params.signal,
    failureMessage: "Title details request failed.",
  });
}
