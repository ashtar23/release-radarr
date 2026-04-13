import test from "node:test";
import assert from "node:assert/strict";

import { rankResults } from "./ranking";
import {
  createSearchContext,
  normalizeSearchKey,
  tokenizeSearchKey,
} from "./normalize";
import type { RankedSearchCandidate, SearchContext } from "./types";

function createContext(query: string): SearchContext {
  const normalizedQuery = normalizeSearchKey(query);
  const queryTokens = tokenizeSearchKey(query);

  return createSearchContext(query, normalizedQuery, queryTokens);
}

function createCandidate(
  name: string,
  overrides: Partial<RankedSearchCandidate["summary"]> = {},
): RankedSearchCandidate {
  return {
    summary: {
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
      ...overrides,
    },
    developers: [],
    publishers: [],
  };
}

test("penalizes specific numeric matches that only align on the number token", () => {
  const ranked = rankResults(
    [
      createCandidate("Battlefield 3", {
        rawgAdded: 4995,
        rawgRatingsCount: 1369,
      }),
      createCandidate("The Witcher 3: Wild Hunt", {
        rawgAdded: 22189,
        rawgRatingsCount: 7181,
      }),
      createCandidate("Witchery", {
        rawgAdded: 0,
        rawgRatingsCount: 0,
      }),
    ],
    createContext("witchr 3"),
  );

  assert.equal(ranked[0]?.summary.name, "The Witcher 3: Wild Hunt");
  assert.equal(ranked[ranked.length - 1]?.summary.name, "Battlefield 3");
});
