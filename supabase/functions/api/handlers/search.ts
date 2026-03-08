import {
  MIN_LOCAL_RESULTS_BEFORE_FALLBACK,
  MIN_QUERY_LENGTH,
} from "../config.ts";
import {
  findLocalResults,
  upsertSearchResults,
} from "../data/titles-repository.ts";
import { fetchRawgSearchResults } from "../providers/rawg.ts";
import type { AdminClient, TitleSummary } from "../types.ts";
import { areSearchResultsStale } from "../utils/freshness.ts";
import { jsonResponse } from "../utils/http.ts";
import { clampLimit } from "../utils/values.ts";

export async function handleSearchRequest(client: AdminClient, url: URL) {
  const query = url.searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters.` },
      400,
    );
  }

  const limit = clampLimit(url.searchParams.get("limit"));
  const localResults = await findLocalResults(client, query, limit);
  const localSummaries = localResults.map((result) => result.summary);
  const returnLocalResults = () => jsonResponse({ query, results: localSummaries });
  const weakResultsThreshold = Math.min(
    limit,
    MIN_LOCAL_RESULTS_BEFORE_FALLBACK,
  );
  const shouldFallbackToRawg =
    localResults.length < weakResultsThreshold ||
    areSearchResultsStale(localResults);

  if (!shouldFallbackToRawg) {
    return returnLocalResults();
  }

  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return returnLocalResults();
  }

  const rawgResults = await tryFetchRawgSearchResults(
    query,
    limit,
    rawgApiKey,
  );
  if (!rawgResults?.length) {
    return returnLocalResults();
  }

  const now = new Date().toISOString();
  const errorMessage = await upsertSearchResults(client, rawgResults, now);

  if (errorMessage) {
    return jsonResponse({ error: errorMessage }, 500);
  }

  return jsonResponse({ query, results: rawgResults });
}

async function tryFetchRawgSearchResults(
  query: string,
  limit: number,
  rawgApiKey: string,
): Promise<TitleSummary[] | null> {
  try {
    return await fetchRawgSearchResults(query, limit, rawgApiKey);
  } catch {
    return null;
  }
}
