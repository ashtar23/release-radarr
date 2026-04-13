import { STRONG_COVERAGE_THRESHOLD } from "./constants";
import { normalizeSearchKey } from "./normalize";
import type {
  RankedSearchCandidate,
  SearchContext,
  SearchTitlesParams,
} from "./types";

type ProviderTrigger = "coverage" | "coverage_and_freshness" | "freshness";

export type SearchExecutionDecision =
  | {
      kind: "local";
      decisionReason: "local_sufficient";
    }
  | {
      kind: "provider";
      providerUsedTrigger: ProviderTrigger;
    };

export function decideSearchExecution(params: {
  rankedLocalResults: RankedSearchCandidate[];
  context: SearchContext;
  page: SearchTitlesParams["page"];
  limit: SearchTitlesParams["limit"];
  forceRefresh: SearchTitlesParams["forceRefresh"];
}): SearchExecutionDecision {
  const localPageResults = slicePage(
    params.rankedLocalResults,
    params.page,
    params.limit,
  );

  if (params.forceRefresh) {
    return {
      kind: "provider",
      providerUsedTrigger:
        localPageResults.length === params.limit
          ? "freshness"
          : "coverage_and_freshness",
    };
  }

  if (
    params.page === 1 &&
    params.context.intentMode === "specific" &&
    isLocallySufficientFirstPage(localPageResults, params.context)
  ) {
    return {
      kind: "local",
      decisionReason: "local_sufficient",
    };
  }

  if (localPageResults.length < params.limit) {
    return {
      kind: "provider",
      providerUsedTrigger: "coverage",
    };
  }

  if (params.page > 1) {
    return {
      kind: "local",
      decisionReason: "local_sufficient",
    };
  }

  if (isLocallySufficientFirstPage(localPageResults, params.context)) {
    return {
      kind: "local",
      decisionReason: "local_sufficient",
    };
  }

  return {
    kind: "provider",
    providerUsedTrigger: "coverage",
  };
}

function isLocallySufficientFirstPage(
  results: RankedSearchCandidate[],
  context: SearchContext,
) {
  const top = results[0];
  if (!top) {
    return false;
  }

  const topMatch = createMatchSignals(top.summary.name, context);

  if (context.intentMode === "specific") {
    return (
      (topMatch.exactMatch ||
        topMatch.startsWithQuery ||
        (topMatch.includesExactQuery &&
          topMatch.coverage >= STRONG_COVERAGE_THRESHOLD) ||
        topMatch.coverage === 1) &&
      hasUsableSpecificMetadata(top, context)
    );
  }

  const strongTopMatches = results
    .slice(0, Math.min(results.length, 5))
    .filter((candidate) => {
      const match = createMatchSignals(candidate.summary.name, context);
      return (
        match.exactMatch ||
        match.startsWithQuery ||
        (match.includesExactQuery && match.coverage >= 0.5) ||
        match.coverage >= STRONG_COVERAGE_THRESHOLD
      );
    }).length;

  const strongTopLexical =
    topMatch.exactMatch ||
    topMatch.startsWithQuery ||
    (topMatch.includesExactQuery &&
      topMatch.coverage >= STRONG_COVERAGE_THRESHOLD);

  if (strongTopLexical && hasHealthyBroadMetadata(top)) {
    return true;
  }

  return strongTopMatches >= 3 && !hasVeryLowEngagement(top);
}

function createMatchSignals(name: string, context: SearchContext) {
  const normalizedName = normalizeSearchKey(name);
  const nameTokens = normalizedName.split(" ").filter(Boolean);
  const nameTokenSet = new Set(nameTokens);
  const matchedTokenCount = context.queryTokens.filter((token) =>
    nameTokenSet.has(token),
  ).length;
  const coverage =
    context.queryTokens.length === 0
      ? 0
      : matchedTokenCount / context.queryTokens.length;

  return {
    exactMatch: normalizedName === context.normalizedQuery,
    startsWithQuery: normalizedName.startsWith(context.normalizedQuery),
    includesExactQuery: normalizedName.includes(context.normalizedQuery),
    coverage,
  };
}

function hasHealthyBroadMetadata(candidate: RankedSearchCandidate) {
  const summary = candidate.summary;
  if (!summary.coverImageUrl || summary.platforms.length === 0) {
    return false;
  }

  return !hasVeryLowEngagement(candidate);
}

function hasUsableSpecificMetadata(
  candidate: RankedSearchCandidate,
  context: SearchContext,
) {
  const summary = candidate.summary;
  if (isWeakShortAcronymSpecificQuery(candidate, context)) {
    return false;
  }

  return (
    summary.platforms.length > 0 &&
    (summary.coverImageUrl !== null || !hasVeryLowEngagement(candidate))
  );
}

function isWeakShortAcronymSpecificQuery(
  candidate: RankedSearchCandidate,
  context: SearchContext,
) {
  if (context.queryClass !== "acronym_title") {
    return false;
  }

  if (context.meaningfulQueryTokens.length !== 1) {
    return false;
  }

  const [token] = context.meaningfulQueryTokens;
  if (!token || token.length > 3) {
    return false;
  }

  return hasVeryLowEngagement(candidate);
}

function hasVeryLowEngagement(candidate: RankedSearchCandidate) {
  const summary = candidate.summary;
  return (
    (summary.rawgAdded ?? 0) < 8 &&
    (summary.rawgRatingsCount ?? 0) < 2 &&
    (summary.rawgReviewsCount ?? 0) < 2 &&
    (summary.rawgSuggestionsCount ?? 0) < 40
  );
}

function slicePage(
  results: RankedSearchCandidate[],
  page: number,
  limit: number,
) {
  const start = (page - 1) * limit;
  return results.slice(start, start + limit);
}
