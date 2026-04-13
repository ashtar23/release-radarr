import type { TitleSummary } from "@repo/types";

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  EDITION_TERMS,
  MAX_LIMIT,
  SEARCH_PHRASE_ALIASES,
  SEARCH_STOPWORDS,
} from "./constants";
import type { SearchContext } from "./types";

export function normalizePage(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

export function normalizeLimit(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(value), MAX_LIMIT);
}

export function shouldUsePreciseSearch(query: string) {
  return (
    tokenizeSearchKey(query).length > 1 || normalizeSearchKey(query).length >= 5
  );
}

export function createSearchContext(
  rawQuery: string,
  normalizedQuery: string,
  queryTokens: string[],
): SearchContext {
  const meaningfulQueryTokens = getMeaningfulSearchTokens(queryTokens);

  return {
    normalizedQuery,
    queryTokens,
    queryTokenSet: new Set(queryTokens),
    meaningfulQueryTokens,
    intentMode: inferSearchIntentMode(rawQuery, normalizedQuery, queryTokens),
    includesEditionTerms: EDITION_TERMS.some((term) =>
      normalizedQuery.includes(term),
    ),
  };
}

function inferSearchIntentMode(
  rawQuery: string,
  normalizedQuery: string,
  queryTokens: string[],
): SearchContext["intentMode"] {
  if (queryTokens.length <= 1) {
    return "broad";
  }

  if (/\d/.test(rawQuery) || /\d/.test(normalizedQuery)) {
    return "specific";
  }

  if (!/\s/.test(rawQuery.trim())) {
    return "broad";
  }

  return "specific";
}

export function parsePlatforms(value: unknown): TitleSummary["platforms"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }

    return [{ id: record.id, name: record.name }];
  });
}

export function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

export function toIsoDateOrNull(value: string | Date | null) {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return typeof value === "string" ? value : null;
}

export function tokenizeSearchKey(value: string) {
  const normalized = normalizeSearchKey(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .map(toCanonicalToken)
    .filter((token) => token.length > 0);
}

export function getMeaningfulSearchTokens(tokens: string[]) {
  const meaningful = Array.from(
    new Set(tokens.filter((token) => !SEARCH_STOPWORDS.has(token))),
  );

  return meaningful.length > 0 ? meaningful : Array.from(new Set(tokens));
}

export function normalizeSearchKey(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z0-9])['’]s\b/g, "$1s")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return SEARCH_PHRASE_ALIASES.reduce(
    (current, alias) => current.replace(alias.pattern, alias.replacement),
    normalized,
  )
    .replace(/\s+/g, " ")
    .trim();
}

function toCanonicalToken(token: string) {
  if (/^[0-9]+$/.test(token)) {
    return token;
  }

  return ROMAN_NUMERAL_MAP[token] ?? token;
}

const ROMAN_NUMERAL_MAP: Record<string, string> = {
  i: "1",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  x: "10",
  xi: "11",
  xii: "12",
  xiii: "13",
  xiv: "14",
  xv: "15",
  xvi: "16",
  xvii: "17",
  xviii: "18",
  xix: "19",
  xx: "20",
};
