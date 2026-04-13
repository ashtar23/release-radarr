import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSearchKey, tokenizeSearchKey } from "./normalize";
import { decideSearchExecution } from "./policy";
import type { RankedSearchCandidate, SearchContext } from "./types";

function createContext(query: string): SearchContext {
  const normalizedQuery = normalizeSearchKey(query);
  const queryTokens = tokenizeSearchKey(query);

  return {
    normalizedQuery,
    queryTokens,
    queryTokenSet: new Set(queryTokens),
    intentMode:
      queryTokens.length > 1 || /\d/.test(query) || /\d/.test(normalizedQuery)
        ? "specific"
        : "broad",
    includesEditionTerms: false,
  };
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

test("keeps exact-title specific queries local when the first page is strong", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [
      createCandidate("God of War"),
      createCandidate("God of War Ragnarok"),
    ],
    context: createContext("god of war"),
    page: 1,
    limit: 2,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "local",
    decisionReason: "local_sufficient",
  });
});

test("triggers provider fallback for weak broad local pages even when full", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [
      createCandidate("Mixtape", {
        coverImageUrl: null,
        platforms: [],
        rawgRatingsCount: 0,
        rawgAdded: 2,
        rawgReviewsCount: 0,
        rawgSuggestionsCount: 4,
      }),
      createCandidate("Mixtape Maker", {
        coverImageUrl: null,
        platforms: [],
        rawgRatingsCount: 0,
        rawgAdded: 1,
        rawgReviewsCount: 0,
        rawgSuggestionsCount: 2,
      }),
    ],
    context: createContext("mixtape"),
    page: 1,
    limit: 2,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "provider",
    providerUsedTrigger: "coverage",
  });
});

test("triggers provider fallback when the local page is underfilled", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [createCandidate("The Witcher 3: Wild Hunt")],
    context: createContext("witchr 3"),
    page: 1,
    limit: 2,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "provider",
    providerUsedTrigger: "coverage",
  });
});

test("keeps strong underfilled specific pages local when the exact family is already covered", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [
      createCandidate("God of War (2018)"),
      createCandidate("God of War II"),
      createCandidate("God of War: Ragnarök"),
    ],
    context: createContext("god of war"),
    page: 1,
    limit: 20,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "local",
    decisionReason: "local_sufficient",
  });
});

test("keeps exact single-result specific pages local when the local match is highly confident", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [createCandidate("Control Resonant")],
    context: createContext("control resonant"),
    page: 1,
    limit: 20,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "local",
    decisionReason: "local_sufficient",
  });
});

test("keeps strong sequel queries local without forcing provider refresh", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [
      createCandidate("The Witcher 3: Wild Hunt"),
      createCandidate("The Witcher 2: Assassins of Kings"),
    ],
    context: createContext("witcher 3"),
    page: 1,
    limit: 2,
    forceRefresh: false,
  });

  assert.deepEqual(decision, {
    kind: "local",
    decisionReason: "local_sufficient",
  });
});

test("uses freshness trigger when force refresh is requested and local coverage is already full", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [
      createCandidate("Resident Evil 4"),
      createCandidate("Resident Evil 4 Remake"),
    ],
    context: createContext("resident evil 4"),
    page: 1,
    limit: 2,
    forceRefresh: true,
  });

  assert.deepEqual(decision, {
    kind: "provider",
    providerUsedTrigger: "freshness",
  });
});

test("uses combined coverage and freshness trigger when force refresh is requested on a sparse page", () => {
  const decision = decideSearchExecution({
    rankedLocalResults: [createCandidate("Control")],
    context: createContext("control resonant"),
    page: 1,
    limit: 2,
    forceRefresh: true,
  });

  assert.deepEqual(decision, {
    kind: "provider",
    providerUsedTrigger: "coverage_and_freshness",
  });
});
