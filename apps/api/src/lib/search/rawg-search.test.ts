import test from "node:test";
import assert from "node:assert/strict";

import { fetchProviderSearchCandidates } from "./data";
import type { TitleSummary } from "@repo/types";

function createSummary(name: string): TitleSummary {
  return {
    id: `rawg:${name}`,
    kind: "game",
    source: "rawg",
    externalId: name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    coverImageUrl: "https://example.com/cover.jpg",
    earliestReleaseDate: "2026-01-01",
    platforms: [{ id: "rawg-platform:4", name: "PC" }],
    rawgRating: 4.2,
    rawgRatingsCount: 120,
    rawgMetacritic: 88,
    rawgAdded: 900,
    rawgReviewsCount: 40,
    rawgSuggestionsCount: 180,
    rawgRatingTop: 5,
  };
}

test("retries provider search without precise mode when precise fetch fails", async () => {
  const calls: Array<{ precise: boolean; exact: boolean }> = [];

  const result = await fetchProviderSearchCandidates(
    {
      query: "witchr 3",
      page: 1,
      limit: 20,
      rawgApiKey: "test-key",
    },
    {
      fetchRawgSearchResults: async (params) => {
        calls.push({ precise: params.precise, exact: params.exact });

        if (params.precise) {
          throw new Error("precise failed");
        }

        return {
          totalCount: 1,
          results: [createSummary("The Witcher 3: Wild Hunt")],
        };
      },
      logProviderFetchFailure: () => undefined,
    },
  );

  assert.deepEqual(calls, [
    { precise: true, exact: false },
    { precise: false, exact: false },
  ]);
  assert.equal(result.totalCount, 1);
  assert.equal(result.results[0]?.summary.name, "The Witcher 3: Wild Hunt");
});

test("throws when both precise and fallback provider search attempts fail", async () => {
  await assert.rejects(
    fetchProviderSearchCandidates(
      {
        query: "witchr 3",
        page: 1,
        limit: 20,
        rawgApiKey: "test-key",
      },
      {
        fetchRawgSearchResults: async () => {
          throw new Error("rawg unavailable");
        },
        logProviderFetchFailure: () => undefined,
      },
    ),
  );
});
