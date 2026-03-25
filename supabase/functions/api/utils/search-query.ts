import type { QueryIntentMode } from "../contracts/search.ts";
import {
  expandNormalizedQueryVariants,
  normalizeSearchKey,
  toCanonicalSearchKey,
  tokenizeSearchKey,
  toLooseComparableTokens,
} from "./search-normalization.ts";

export interface QuerySearchOptions {
  intentMode: QueryIntentMode;
  precise: boolean;
  exact: boolean;
}

export interface SearchQueryContext {
  query: string;
  normalizedQuery: string;
  queryTokens: string[];
  queryTokenSet: Set<string>;
  looseQueryTokens: string[];
  looseQueryTokenSet: Set<string>;
  queryNumericTokens: string[];
}

export function createSearchQueryContext(query: string): SearchQueryContext {
  const queryTokens = tokenizeSearchKey(query);
  const looseQueryTokens = toLooseComparableTokens(queryTokens);

  return {
    query,
    normalizedQuery: toCanonicalSearchKey(query),
    queryTokens,
    queryTokenSet: new Set(queryTokens),
    looseQueryTokens,
    looseQueryTokenSet: new Set(looseQueryTokens),
    queryNumericTokens: extractNumericTokens(queryTokens),
  };
}

export function inferQuerySearchOptions(
  query: string,
  queryTokens = tokenizeSearchKey(query),
): QuerySearchOptions {
  const hasNumericToken = queryTokens.some((token) => /^[0-9]+$/.test(token));
  const rawWordCount = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
  const hasMultipleWords = rawWordCount >= 2;

  const intentMode: QueryIntentMode =
    hasNumericToken || hasMultipleWords ? "specific" : "broad";

  return {
    intentMode,
    precise: intentMode === "specific",
    // RAWG exact matching is brittle for real-world title input
    // (diacritics, punctuation, alt naming). Favor recall + our ranking.
    exact: false,
  };
}

export function getSearchQueryVariants(query: string) {
  return expandNormalizedQueryVariants(query);
}

export function getProviderSearchQuery(query: string) {
  return normalizeSearchKey(query);
}

export function isTruthyFlag(value: string | null) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function extractNumericTokens(tokens: string[]) {
  return tokens.filter((token) => /^[0-9]+$/.test(token));
}
