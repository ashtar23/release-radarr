import test from "node:test";
import assert from "node:assert/strict";

import type { TitleSummary } from "@repo/types";

import { resolveProviderRefresh } from "./service";
import type { RankedSearchCandidate, SearchContext } from "./types";

function createSummary(
  name: string,
  overrides: Partial<TitleSummary> = {},
): TitleSummary {
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
    ...overrides,
  };
}

function createCandidate(
  name: string,
  overrides: Partial<TitleSummary> = {},
): RankedSearchCandidate {
  return {
    summary: createSummary(name, overrides),
    developers: [],
    publishers: [],
  };
}

function createContext(query: string): SearchContext {
  const queryTokens = query.split(" ");

  return {
    normalizedQuery: query,
    queryTokens,
    queryTokenSet: new Set(queryTokens),
    meaningfulQueryTokens: queryTokens.filter((token) => !/\d/.test(token)),
    intentMode: "specific",
    includesEditionTerms: false,
  };
}

test("serves provider results even when provider summary upsert fails", async () => {
  const localResults = [createCandidate("The Witcher 3: Wild Hunt")];
  const providerResults = [
    createCandidate("The Witcher 3: Wild Hunt"),
    createCandidate("The Witcher 3: Wild Hunt – Blood and Wine"),
  ];

  const result = await resolveProviderRefresh({
    query: "witchr 3",
    localResults,
    localTotalCount: 1,
    context: createContext("witchr 3"),
    page: 1,
    limit: 20,
    forceRefresh: false,
    providerUsedTrigger: "coverage",
    rawgApiKey: "test-key",
    deps: {
      fetchProviderSearchCandidates: async () => ({
        totalCount: 2,
        results: providerResults,
      }),
      upsertProviderSearchResults: async () => {
        throw new Error("db write failed");
      },
      enrichProviderSearchResults: async () => undefined,
      mergeUniqueResults: (local, provider) => [...local, ...provider.slice(1)],
      rankResults: (results) => results,
      logProviderRefreshFailure: () => undefined,
    },
  });

  assert.deepEqual(result, {
    results: providerResults,
    totalCount: 2,
    servedBy: "rawg-refresh",
    decisionReason: "provider_used",
    providerUsedTrigger: "coverage",
  });
});

test("falls back to local results when provider fetch itself fails", async () => {
  const localResults = [createCandidate("The Witcher 3: Wild Hunt")];

  const result = await resolveProviderRefresh({
    query: "witchr 3",
    localResults,
    localTotalCount: 1,
    context: createContext("witchr 3"),
    page: 1,
    limit: 20,
    forceRefresh: false,
    providerUsedTrigger: "coverage",
    rawgApiKey: "test-key",
    deps: {
      fetchProviderSearchCandidates: async () => {
        throw new Error("rawg unavailable");
      },
      upsertProviderSearchResults: async () => undefined,
      enrichProviderSearchResults: async () => undefined,
      mergeUniqueResults: (local) => local,
      rankResults: (results) => results,
      logProviderRefreshFailure: () => undefined,
    },
  });

  assert.deepEqual(result, {
    results: localResults,
    totalCount: 1,
    servedBy: "local-cache",
    decisionReason: "provider_fetch_failed",
  });
});
