import { API_PATH_PREFIX } from "@repo/config";
import type { TitleSearchResult } from "@repo/types";

import { isTitleSearchResult } from "./payload-guards";
import { requestJson, type RequestContext } from "./request";

export interface SearchTitlesParams {
  readonly query: string;
  readonly page?: number;
  readonly limit?: number;
  readonly forceRefresh?: boolean;
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
  const searchBaseUrl = context.searchBaseUrl;
  const normalizedQuery = params.query.trim();
  const page = normalizePage(params.page);
  const limit = normalizeLimit(params.limit);

  if (!normalizedQuery) {
    return {
      query: "",
      results: [],
      totalCount: 0,
      page,
      limit,
      hasMore: false,
      servedBy: "local-cache",
    };
  }

  const searchParams = new URLSearchParams({
    query: normalizedQuery,
    page: String(page),
    limit: String(limit),
  });

  if (params.forceRefresh) {
    searchParams.set("forceRefresh", "1");
  }

  const requestPath =
    searchBaseUrl == null
      ? `${API_PATH_PREFIX}/titles?${searchParams.toString()}`
      : `/titles?${searchParams.toString()}`;

  const payload = await requestJson({
    context,
    baseUrl: searchBaseUrl,
    method: "GET",
    path: requestPath,
    signal: params.signal,
    validate: isTitleSearchResult,
    invalidPayloadMessage: "Search response payload is invalid.",
    failureMessage: "Search request failed.",
  });

  return {
    ...payload,
    servedBy: payload.servedBy ?? "local-cache",
  };
}

const DEFAULT_SEARCH_LIMIT = 20;
const DEFAULT_SEARCH_PAGE = 1;

function normalizePage(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return DEFAULT_SEARCH_PAGE;
  }

  return Math.floor(value);
}

function normalizeLimit(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(Math.floor(value), 25);
}
