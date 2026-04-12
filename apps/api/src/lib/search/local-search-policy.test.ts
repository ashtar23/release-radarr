import test from "node:test";
import assert from "node:assert/strict";

import { getLocalSearchPolicy } from "./local-search-policy";

test("uses discovery-friendly thresholds for broad single-token queries", () => {
  const policy = getLocalSearchPolicy({
    normalizedQuery: "the",
    queryTokens: ["the"],
    intentMode: "broad",
  });

  assert.deepEqual(policy, {
    minimumSimilarity: 0.3,
    minimumTokenMatches: 1,
    minimumPartialSimilarity: 0.3,
    requireFullTokenCoverage: false,
  });
});

test("tightens token coverage for specific two-token queries with numbers", () => {
  const policy = getLocalSearchPolicy({
    normalizedQuery: "witcher 3",
    queryTokens: ["witcher", "3"],
    intentMode: "specific",
  });

  assert.deepEqual(policy, {
    minimumSimilarity: 0.18,
    minimumTokenMatches: 2,
    minimumPartialSimilarity: 0.34,
    requireFullTokenCoverage: true,
  });
});

test("allows near-miss partial coverage for typo-prone specific queries", () => {
  const policy = getLocalSearchPolicy({
    normalizedQuery: "witchr 3",
    queryTokens: ["witchr", "3"],
    intentMode: "specific",
  });

  assert.deepEqual(policy, {
    minimumSimilarity: 0.18,
    minimumTokenMatches: 2,
    minimumPartialSimilarity: 0.34,
    requireFullTokenCoverage: true,
  });
});

test("requires near-full token coverage for longer specific phrases", () => {
  const policy = getLocalSearchPolicy({
    normalizedQuery: "god of war",
    queryTokens: ["god", "of", "war"],
    intentMode: "specific",
  });

  assert.deepEqual(policy, {
    minimumSimilarity: 0.14,
    minimumTokenMatches: 3,
    minimumPartialSimilarity: 0.26,
    requireFullTokenCoverage: true,
  });
});
