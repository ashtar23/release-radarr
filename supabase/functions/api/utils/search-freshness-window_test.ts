import type { LocalSearchResult, TitleSummary } from "../types.ts";
import { createSearchQueryContext } from "./search-query.ts";
import { getRelevantLocalStaleRatio } from "./search-freshness-window.ts";
import { mergeResults } from "./search-ranking.ts";

Deno.test("freshness ratio matches fallback rerank path for specific queries", () => {
  const query = "city skylines";
  const page = 1;
  const limit = 20;
  const localResults = createLocalResults(120);
  const localSummaries = localResults.map((result) => result.summary);

  const fallbackRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    "specific",
    page,
    limit,
  );

  const merged = mergeResults(
    localSummaries,
    [],
    query,
    "specific",
    page,
    limit,
    createSearchQueryContext(query),
  );
  const precomputedRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    "specific",
    page,
    limit,
    merged.rankedPageResultIds,
  );

  if (fallbackRatio !== precomputedRatio) {
    throw new Error(
      `Expected equal stale ratios, got fallback=${fallbackRatio}, precomputed=${precomputedRatio}`,
    );
  }
});

Deno.test("freshness ratio matches fallback rerank path for broad queries", () => {
  const query = "wolverine";
  const page = 1;
  const limit = 20;
  const localResults = createLocalResults(120);
  const localSummaries = localResults.map((result) => result.summary);

  const fallbackRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    "broad",
    page,
    limit,
  );

  const merged = mergeResults(
    localSummaries,
    [],
    query,
    "broad",
    page,
    limit,
    createSearchQueryContext(query),
  );
  const precomputedRatio = getRelevantLocalStaleRatio(
    localResults,
    query,
    "broad",
    page,
    limit,
    merged.rankedPageResultIds,
  );

  if (fallbackRatio !== precomputedRatio) {
    throw new Error(
      `Expected equal stale ratios, got fallback=${fallbackRatio}, precomputed=${precomputedRatio}`,
    );
  }
});

function createLocalResults(count: number): LocalSearchResult[] {
  return Array.from({ length: count }, (_, index) => ({
    summary: createTitleSummary(index),
    searchUpdatedAt: index % 4 === 0
      ? "2020-01-01T00:00:00.000Z"
      : "2026-01-01T00:00:00.000Z",
  }));
}

function createTitleSummary(index: number): TitleSummary {
  return {
    id: `rawg:freshness-${index}`,
    kind: "game",
    source: "rawg",
    externalId: `freshness-${index}`,
    slug: `freshness-${index}`,
    name: index % 12 === 0 ? "Marvel's Wolverine" : `City archive ${index}`,
    coverImageUrl: null,
    earliestReleaseDate: "2023-01-01",
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
    rawgRating: 4,
    rawgRatingsCount: 400,
    rawgMetacritic: 80,
    rawgAdded: 2000,
    rawgReviewsCount: 300,
    rawgSuggestionsCount: 120,
    rawgRatingTop: 5,
  };
}
