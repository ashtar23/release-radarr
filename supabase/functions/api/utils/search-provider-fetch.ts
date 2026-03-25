import { fetchRawgSearchResults } from "../providers/rawg.ts";
import type { RawgSearchPage, TitleSummary } from "../types.ts";

type RawgPageFetcher = (
  query: string,
  page: number,
  limit: number,
  precise: boolean,
  exact: boolean,
  rawgApiKey: string,
) => Promise<RawgSearchPage | null>;

async function tryFetchRawgSearchResults(
  query: string,
  page: number,
  limit: number,
  precise: boolean,
  exact: boolean,
  rawgApiKey: string,
): Promise<RawgSearchPage | null> {
  try {
    return await fetchRawgSearchResults(
      query,
      page,
      limit,
      precise,
      exact,
      rawgApiKey,
    );
  } catch {
    return null;
  }
}

export async function tryFetchRawgSearchResultsWithBudget(
  query: string,
  page: number,
  limit: number,
  precise: boolean,
  exact: boolean,
  rawgApiKey: string,
  maxPages: number,
  fetchPage: RawgPageFetcher = tryFetchRawgSearchResults,
): Promise<RawgSearchPage | null> {
  const firstPage = await fetchPage(
    query,
    page,
    limit,
    precise,
    exact,
    rawgApiKey,
  );
  if (!firstPage) {
    return null;
  }

  if (maxPages <= 1) {
    return firstPage;
  }

  const aggregatedResults: TitleSummary[] = [...firstPage.results];
  let totalCount = firstPage.totalCount;
  const additionalPagesToFetch: number[] = [];

  for (let pageOffset = 1; pageOffset < maxPages; pageOffset += 1) {
    const nextPageNumber = page + pageOffset;
    if (
      typeof totalCount === "number" &&
      Number.isFinite(totalCount) &&
      (nextPageNumber - 1) * limit >= totalCount
    ) {
      break;
    }

    additionalPagesToFetch.push(nextPageNumber);
  }

  if (additionalPagesToFetch.length === 0) {
    return {
      totalCount,
      results: aggregatedResults,
    };
  }

  // Fetch extra pages in parallel after the first successful page to reduce
  // sparse-broad tail latency, then process in order to preserve current
  // stop-on-gap behavior.
  const additionalPages = await Promise.all(
    additionalPagesToFetch.map((nextPageNumber) =>
      fetchPage(
        query,
        nextPageNumber,
        limit,
        precise,
        exact,
        rawgApiKey,
      )
    ),
  );

  for (const nextPage of additionalPages) {
    if (!nextPage) {
      break;
    }

    if (
      typeof nextPage.totalCount === "number" &&
      Number.isFinite(nextPage.totalCount)
    ) {
      totalCount = typeof totalCount === "number"
        ? Math.max(totalCount, nextPage.totalCount)
        : nextPage.totalCount;
    }

    if (nextPage.results.length === 0) {
      break;
    }

    aggregatedResults.push(...nextPage.results);
  }

  return {
    totalCount,
    results: aggregatedResults,
  };
}
