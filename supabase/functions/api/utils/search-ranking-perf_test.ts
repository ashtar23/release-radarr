import type { LocalSearchResult, TitleSummary } from "../types.ts";
import { getRelevantLocalStaleRatio } from "./search-freshness-window.ts";
import { createSearchQueryContext } from "./search-query.ts";
import { mergeResults } from "./search-ranking.ts";

Deno.test("informational perf harness: local ranking + freshness sampling", () => {
  const query = "wolverine";
  const page = 1;
  const limit = 20;
  const localSummaries = createDeterministicSummaries(800);
  const localResults: LocalSearchResult[] = localSummaries.map((summary, index) => ({
    summary,
    searchUpdatedAt: index % 5 === 0
      ? "2020-01-01T00:00:00.000Z"
      : "2026-01-01T00:00:00.000Z",
  }));

  const queryContext = createSearchQueryContext(query);
  const startedAt = performance.now();

  let lastStaleRatio = 0;
  for (let iteration = 0; iteration < 25; iteration += 1) {
    const merged = mergeResults(
      localSummaries,
      [],
      query,
      "broad",
      page,
      limit,
      queryContext,
    );
    lastStaleRatio = getRelevantLocalStaleRatio(
      localResults,
      query,
      "broad",
      page,
      limit,
      merged.rankedPageResultIds,
    );
  }

  const elapsedMs = performance.now() - startedAt;
  console.log(
    `[perf] local ranking+freshness: iterations=25, candidates=${localSummaries.length}, elapsedMs=${elapsedMs.toFixed(2)}`,
  );

  if (lastStaleRatio < 0 || lastStaleRatio > 1) {
    throw new Error(`Expected stale ratio in [0,1], got ${lastStaleRatio}`);
  }
});

function createDeterministicSummaries(count: number): TitleSummary[] {
  const rng = createSeededRandom(42);
  return Array.from({ length: count }, (_, index) => {
    const isFlagship = index % 57 === 0;
    const nameSuffix = isFlagship ? "Marvel's Wolverine" : `Wolverine archive ${index}`;
    const releaseYear = isFlagship ? 2027 : 2000 + Math.floor(rng() * 24);

    return {
      id: `rawg:perf-${index}`,
      kind: "game",
      source: "rawg",
      externalId: `perf-${index}`,
      slug: `perf-${index}`,
      name: nameSuffix,
      coverImageUrl: rng() > 0.3 ? `https://example.com/${index}.png` : null,
      earliestReleaseDate: `${releaseYear}-01-01`,
      platforms: [
        {
          id: "rawg-platform:pc",
          name: rng() > 0.1 ? "PC" : "Web",
        },
      ],
      rawgRating: round2(1 + rng() * 4),
      rawgRatingsCount: Math.floor(rng() * 10000),
      rawgMetacritic: Math.floor(20 + rng() * 75),
      rawgAdded: Math.floor(rng() * 30000),
      rawgReviewsCount: Math.floor(rng() * 5000),
      rawgSuggestionsCount: Math.floor(rng() * 1500),
      rawgRatingTop: Math.floor(1 + rng() * 5),
    };
  });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function createSeededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
