import { API_PATH_PREFIX } from "@repo/config";
import type { TitleSearchResult } from "@repo/types";

import { isTitleSearchResult } from "./payload-guards";
import { requestJson, type RequestContext } from "./request";

export interface SearchTitlesParams {
  readonly query: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

interface SearchTitlesRequestParams {
  readonly context: RequestContext;
  readonly params: SearchTitlesParams;
}

export async function searchTitles({
  context,
  params,
}: SearchTitlesRequestParams): Promise<TitleSearchResult> {
  const normalizedQuery = params.query.trim();
  if (!normalizedQuery) {
    return { query: "", results: [] };
  }

  const searchParams = new URLSearchParams({ query: normalizedQuery });
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return requestJson({
    context,
    method: "GET",
    path: `${API_PATH_PREFIX}/titles?${searchParams.toString()}`,
    signal: params.signal,
    validate: isTitleSearchResult,
    invalidPayloadMessage: "Search response payload is invalid.",
    failureMessage: "Search request failed.",
  });
}
