import type { SearchIntentMode } from "./types";

export function getLocalSearchPolicy(params: {
  normalizedQuery: string;
  queryTokens: string[];
  intentMode: SearchIntentMode;
}) {
  const minimumSimilarity = getMinimumSimilarityThreshold(
    params.normalizedQuery,
    params.queryTokens.length,
  );

  if (params.intentMode === "specific" && params.queryTokens.length > 1) {
    return {
      minimumSimilarity,
      minimumTokenMatches: params.queryTokens.length,
      minimumPartialSimilarity:
        params.queryTokens.length >= 3 ? 0.26 : 0.34,
      requireFullTokenCoverage: true,
    };
  }

  return {
    minimumSimilarity,
    minimumTokenMatches: 1,
    minimumPartialSimilarity: minimumSimilarity,
    requireFullTokenCoverage: false,
  };
}

function getMinimumSimilarityThreshold(
  normalizedQuery: string,
  tokenCount: number,
) {
  if (tokenCount >= 3) {
    return 0.14;
  }

  if (tokenCount === 2) {
    return 0.18;
  }

  if (normalizedQuery.length >= 8) {
    return 0.22;
  }

  return 0.3;
}
