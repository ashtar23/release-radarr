import type { SearchIntentMode } from "./types";
import { getMeaningfulSearchTokens } from "./normalize";

export function getLocalSearchPolicy(params: {
  normalizedQuery: string;
  queryTokens: string[];
  intentMode: SearchIntentMode;
}) {
  const matchTokens =
    params.intentMode === "specific" && params.queryTokens.length > 1
      ? getMeaningfulSearchTokens(params.queryTokens)
      : Array.from(new Set(params.queryTokens));
  const minimumSimilarity = getMinimumSimilarityThreshold(
    params.normalizedQuery,
    matchTokens.length,
  );

  if (params.intentMode === "specific" && matchTokens.length > 1) {
    return {
      matchTokens,
      minimumSimilarity,
      minimumTokenMatches: matchTokens.length,
      minimumPartialSimilarity: matchTokens.length >= 3 ? 0.26 : 0.34,
      requireFullTokenCoverage: true,
    };
  }

  return {
    matchTokens,
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
