import type { QueryIntentMode } from "../contracts/search.ts";
import type { TitleSummary } from "../types.ts";
import {
  tokenizeSearchKey,
  toLooseComparableTokens,
} from "./search-normalization.ts";
import { searchRankingTuning } from "./search-ranking-tuning.ts";

interface StrongSpecificMatchEntry {
  includesExactQuery: boolean;
  coverage: number;
  score: number;
}

export interface SpecificDenoiseResult<T> {
  results: T[];
  relevanceExhausted: boolean;
}

export function applySpecificQueryDenoise<T extends StrongSpecificMatchEntry>(
  results: T[],
  page: number,
  limit: number,
): SpecificDenoiseResult<T> {
  const strongMatches = results.filter(isStrongSpecificMatch);

  if (page === 1) {
    if (
      strongMatches.length >=
      Math.min(searchRankingTuning.specific.denoisePageOneStrongMin, limit)
    ) {
      return { results: strongMatches, relevanceExhausted: false };
    }

    return { results, relevanceExhausted: false };
  }

  const minimumStrongMatches = Math.max(
    searchRankingTuning.specific.denoiseLaterPagesStrongMinFloor,
    Math.floor(
      limit * searchRankingTuning.specific.denoiseLaterPagesStrongRatio,
    ),
  );
  if (strongMatches.length < minimumStrongMatches) {
    return {
      results: strongMatches,
      relevanceExhausted: true,
    };
  }

  return { results: strongMatches, relevanceExhausted: false };
}

function isStrongSpecificMatch(result: StrongSpecificMatchEntry) {
  return (
    result.includesExactQuery ||
    result.coverage >=
      searchRankingTuning.specific.denoiseStrongCoverageThreshold ||
    result.score >= searchRankingTuning.specific.denoiseStrongScoreThreshold
  );
}

export interface SpecificDerivativeSubtitleEvaluation {
  queryMentionsSubtitle: boolean;
  capEligible: boolean;
  shouldDemote: boolean;
}

interface SpecificDerivativeCapEntry {
  result: TitleSummary;
  exactMatch: boolean;
  includesExactQuery: boolean;
  coverage: number;
  qualityScore: number;
  hasMainstreamPlatform: boolean;
  derivativeEvaluation: SpecificDerivativeSubtitleEvaluation | null;
}

export function applySpecificDerivativeSubtitleCap<
  T extends SpecificDerivativeCapEntry,
>(results: T[], queryTokens: string[]) {
  if (results.length <= 1) {
    return results;
  }

  const looseQueryTokens = toLooseComparableTokens(queryTokens);
  const looseQueryTokenSet = new Set(looseQueryTokens);
  const derivativeEvaluations = results.map(
    (entry) =>
      entry.derivativeEvaluation ??
      evaluateSpecificDerivativeSubtitleResult({
        result: entry.result,
        queryTokens,
        looseQueryTokens,
        looseQueryTokenSet,
        exactMatch: entry.exactMatch,
        includesExactQuery: entry.includesExactQuery,
        coverage: entry.coverage,
        qualityScore: entry.qualityScore,
        hasMainstreamPlatformSignal: entry.hasMainstreamPlatform,
        subtitleParts: splitDerivativeSubtitle(entry.result.name),
      }),
  );
  const queryTargetsSpecificSubtitle = derivativeEvaluations.some(
    (evaluation) => evaluation?.queryMentionsSubtitle,
  );
  if (queryTargetsSpecificSubtitle) {
    return results;
  }

  const topResults: T[] = [];
  const remainder: T[] = [];
  const deferredDerivativeEntries: T[] = [];
  let derivativeCountInTopWindow = 0;

  for (let index = 0; index < results.length; index += 1) {
    const entry = results[index];
    const evaluation = derivativeEvaluations[index];

    if (topResults.length < searchRankingTuning.specific.derivativeTopWindow) {
      const capEligibleDerivative = evaluation?.capEligible ?? false;
      if (
        capEligibleDerivative &&
        derivativeCountInTopWindow >=
          searchRankingTuning.specific.derivativeTopCap
      ) {
        deferredDerivativeEntries.push(entry);
        continue;
      }

      topResults.push(entry);
      if (capEligibleDerivative) {
        derivativeCountInTopWindow += 1;
      }
      continue;
    }

    remainder.push(entry);
  }

  if (deferredDerivativeEntries.length === 0) {
    return results;
  }

  return [...topResults, ...remainder];
}

export function computeSpecificDerivativeSubtitlePenalty(
  intentMode: QueryIntentMode,
  extraTokenCount: number,
  derivativeEvaluation: SpecificDerivativeSubtitleEvaluation | null,
) {
  if (intentMode !== "specific") {
    return 0;
  }

  if (!derivativeEvaluation?.shouldDemote) {
    return 0;
  }

  let penalty = -searchRankingTuning.specific.derivativeDemoteBasePenalty;
  if (
    extraTokenCount >=
    searchRankingTuning.specific.derivativeDemoteExtraTokenThreshold
  ) {
    penalty -= searchRankingTuning.specific.derivativeDemoteExtraPenalty;
  }

  return penalty;
}

export function computeSpecificMainlineSequelBoost(
  intentMode: QueryIntentMode,
  includesExactQuery: boolean,
  coverage: number,
  queryHasNumericToken: boolean,
  queryHasDerivativeIntentSignal: boolean,
  looseQueryTokenSet: Set<string>,
  hasDerivativeSubtitle: boolean,
  primaryTokens: string[],
) {
  if (intentMode !== "specific") {
    return 0;
  }

  if (queryHasNumericToken) {
    return 0;
  }

  if (
    !includesExactQuery ||
    coverage < searchRankingTuning.specific.sequelCoverageThreshold
  ) {
    return 0;
  }

  if (queryHasDerivativeIntentSignal) {
    return 0;
  }

  if (hasDerivativeSubtitle) {
    return 0;
  }

  const queryRequestsPortVariant =
    looseQueryTokenSet.has("pc") ||
    looseQueryTokenSet.has("steam") ||
    looseQueryTokenSet.has("port");
  const hasPortVariantSuffix =
    primaryTokens.includes("port") &&
    (primaryTokens.includes("pc") || primaryTokens.includes("steam"));
  if (hasPortVariantSuffix && !queryRequestsPortVariant) {
    // Avoid promoting platform-port variants over core canonical catalog entries
    // when the query does not explicitly ask for a port.
    return 0;
  }

  const hasSequelNumber = primaryTokens.some((token) =>
    /^[2-9][0-9]*$/.test(token),
  );
  if (!hasSequelNumber) {
    return 0;
  }

  return searchRankingTuning.specific.sequelBoost;
}

export function splitDerivativeSubtitle(name: string) {
  const match = name.match(/^(.+?)\s[-:]\s(.+)$/);
  if (!match) {
    return null;
  }

  const base = match[1]?.trim() ?? "";
  const subtitle = match[2]?.trim() ?? "";
  if (base.length === 0 || subtitle.length === 0) {
    return null;
  }

  return { base, subtitle };
}

export function queryHasDerivativeIntent(queryTokens: Set<string>) {
  return (
    queryTokens.has("dlc") ||
    queryTokens.has("expansion") ||
    queryTokens.has("episode") ||
    queryTokens.has("chapter") ||
    (queryTokens.has("season") && queryTokens.has("pass")) ||
    (queryTokens.has("story") && queryTokens.has("pack")) ||
    queryTokens.has("addon") ||
    (queryTokens.has("add") && queryTokens.has("on")) ||
    queryTokens.has("bundle")
  );
}

export interface EvaluateSpecificDerivativeSubtitleParams {
  result: TitleSummary;
  queryTokens: string[];
  looseQueryTokens: string[];
  looseQueryTokenSet: Set<string>;
  exactMatch: boolean;
  includesExactQuery: boolean;
  coverage: number;
  qualityScore: number;
  hasMainstreamPlatformSignal: boolean;
  subtitleParts: { base: string; subtitle: string } | null;
}

export function evaluateSpecificDerivativeSubtitleResult(
  params: EvaluateSpecificDerivativeSubtitleParams,
): SpecificDerivativeSubtitleEvaluation | null {
  if (params.exactMatch) {
    return null;
  }

  if (
    !params.includesExactQuery &&
    params.coverage < searchRankingTuning.specific.derivativeCoverageThreshold
  ) {
    return null;
  }

  if (!params.subtitleParts) {
    return null;
  }

  const baseTokens = tokenizeSearchKey(params.subtitleParts.base);
  const subtitleTokens = tokenizeSearchKey(params.subtitleParts.subtitle);
  if (
    baseTokens.length < searchRankingTuning.specific.derivativeBaseTokenMin ||
    subtitleTokens.length === 0
  ) {
    return null;
  }

  const looseBaseTokenSet = new Set(toLooseComparableTokens(baseTokens));
  const looseSubtitleTokenSet = new Set(
    toLooseComparableTokens(subtitleTokens),
  );
  const baseMatches = params.looseQueryTokens.filter((token) =>
    looseBaseTokenSet.has(token),
  ).length;
  const baseCoverage =
    params.queryTokens.length > 0 ? baseMatches / params.queryTokens.length : 0;
  if (baseCoverage < searchRankingTuning.specific.derivativeCoverageThreshold) {
    return null;
  }

  const queryMentionsSubtitle = [...params.looseQueryTokenSet].some((token) =>
    looseSubtitleTokenSet.has(token),
  );
  const strongPopularitySignals =
    (params.result.rawgRatingsCount ?? 0) >=
      searchRankingTuning.specific.derivativeStrongPopularityRatingsCount ||
    (params.result.rawgAdded ?? 0) >=
      searchRankingTuning.specific.derivativeStrongPopularityAdded;
  const mainstreamSolidQuality =
    params.hasMainstreamPlatformSignal &&
    params.qualityScore >=
      searchRankingTuning.specific.derivativeMainstreamSolidQualityThreshold;
  const qualityProtected =
    params.qualityScore >=
      searchRankingTuning.specific.derivativeQualityProtectedThreshold ||
    mainstreamSolidQuality ||
    strongPopularitySignals;
  const capEligible =
    !queryMentionsSubtitle &&
    !queryHasDerivativeIntent(params.looseQueryTokenSet);
  const shouldDemote = capEligible && !qualityProtected;

  return {
    queryMentionsSubtitle,
    capEligible,
    shouldDemote,
  };
}
