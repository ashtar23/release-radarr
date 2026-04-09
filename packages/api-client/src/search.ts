import type { TitleSearchResponse } from "./openapi-types";
import { openApiGet } from "./openapi-client";
import type { RequestContext } from "./request";

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
}: SearchTitlesRequestParams): Promise<TitleSearchResponse> {
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

  const payload = await openApiGet({
    context,
    path: "/titles",
    query: {
      query: normalizedQuery,
      page: String(page),
      limit: String(limit),
      ...(params.forceRefresh ? { forceRefresh: "1" } : {}),
    },
    signal: params.signal,
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
