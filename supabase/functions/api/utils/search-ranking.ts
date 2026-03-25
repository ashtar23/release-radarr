import {
  isSearchBroadDenoiseEnabled,
  isSearchRankingV2Enabled,
} from "../config.ts";
import type { QueryIntentMode } from "../contracts/search.ts";
import type { TitleSummary } from "../types.ts";
import {
  applyBroadFranchiseDenoise,
  computeBroadLowSignalAdjustment,
  computeBroadRecencyBoost,
  hasMainstreamPlatform,
} from "./search-ranking-broad.ts";
import {
  applySpecificDerivativeSubtitleCap,
  applySpecificQueryDenoise,
  computeSpecificDerivativeSubtitlePenalty,
  computeSpecificMainlineSequelBoost,
  evaluateSpecificDerivativeSubtitleResult,
  queryHasDerivativeIntent,
  type SpecificDerivativeSubtitleEvaluation,
  splitDerivativeSubtitle,
} from "./search-ranking-specific.ts";
import {
  LEXICAL_CONFIDENCE,
  computeProviderQualityAdjustment,
  computeProviderQualityAdjustmentV2,
  computeProviderQualityComposite,
  type LexicalConfidence,
} from "./provider-quality.ts";
import {
  normalizeSearchKey,
  toCanonicalSearchKey,
  tokenizeSearchKey,
  toLooseComparableTokens,
} from "./search-normalization.ts";
import {
  createSearchQueryContext,
  type SearchQueryContext,
} from "./search-query.ts";
import { searchRankingTuning } from "./search-ranking-tuning.ts";

export { isAnticipationProtected } from "./search-ranking-broad.ts";

const EDITION_SUFFIX_PATTERN =
  /(?:complete|edition|enhanced|game of the year|goty|remaster|definitive|director'?s cut|ultimate|bundle)\b/;
const FRANCHISE_QUERY_NOISE_PENALTIES: ReadonlyArray<{
  keyword: string;
  points: number;
}> = [
  ...searchRankingTuning.noisePenalties.base,
  ...searchRankingTuning.noisePenalties.franchise,
];
const WEB_INTENT_TOKEN_SET = new Set(
  searchRankingTuning.platformRelevance.webIntentTokens,
);

export interface MergeResultsResult {
  results: TitleSummary[];
  relevanceExhausted: boolean;
  rankedPageResultIds: string[];
}

export function mergeResults(
  localResults: TitleSummary[],
  rawgResults: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
  queryContext = createSearchQueryContext(query),
): MergeResultsResult {
  const dedupedResults = dedupeById([...rawgResults, ...localResults]);
  const rankedResults = rankResults(
    dedupedResults,
    query,
    intentMode,
    isSearchRankingV2Enabled(),
    queryContext,
  );
  const queryTokens = queryContext.queryTokens;

  if (intentMode !== "specific") {
    const denoisedResults =
      isSearchBroadDenoiseEnabled() &&
      isSingleTokenFranchiseQuery(queryTokens, intentMode)
        ? applyBroadFranchiseDenoise(rankedResults, limit)
        : rankedResults;
    const pageEntries = sliceRankedPage(denoisedResults, page, limit);
    return {
      results: pageEntries.map((entry) => entry.result),
      relevanceExhausted: false,
      rankedPageResultIds: pageEntries.map((entry) => entry.result.id),
    };
  }

  const denoised = applySpecificQueryDenoise(rankedResults, page, limit);
  const pageEntries = sliceRankedPage(denoised.results, page, limit);
  return {
    results: pageEntries.map((entry) => entry.result),
    relevanceExhausted: denoised.relevanceExhausted,
    rankedPageResultIds: pageEntries.map((entry) => entry.result.id),
  };
}

function sliceRankedPage(
  results: RankedSearchResult[],
  page: number,
  limit: number,
) {
  const start = Math.max(0, (page - 1) * limit);
  return results.slice(start, start + limit);
}

export function dedupeById(results: TitleSummary[]) {
  const deduped: TitleSummary[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (seenIds.has(result.id)) {
      continue;
    }

    seenIds.add(result.id);
    deduped.push(result);
  }

  return deduped;
}

interface RankedSearchResult {
  result: TitleSummary;
  score: number;
  coverage: number;
  exactMatch: boolean;
  includesExactQuery: boolean;
  extraTokenCount: number;
  qualityScore: number;
  hasMainstreamPlatform: boolean;
  isWebOnly: boolean;
  derivativeEvaluation: SpecificDerivativeSubtitleEvaluation | null;
}

interface ScoringRunOptions {
  singleTokenFranchiseQuery: boolean;
  queryHasNumericToken: boolean;
  looseQueryTokenSet: Set<string>;
  queryHasDerivativeIntent: boolean;
  noisePenalties: ReadonlyArray<{ keyword: string; points: number }> | null;
}

export function rankResults(
  results: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  rankingV2Enabled = isSearchRankingV2Enabled(),
  queryContext = createSearchQueryContext(query),
) {
  const singleTokenFranchiseQuery = isSingleTokenFranchiseQuery(
    queryContext.queryTokens,
    intentMode,
  );
  const noisePenalties =
    intentMode !== "specific" && !singleTokenFranchiseQuery
      ? null
      : singleTokenFranchiseQuery
        ? FRANCHISE_QUERY_NOISE_PENALTIES
        : searchRankingTuning.noisePenalties.base;
  const scoringOptions: ScoringRunOptions = {
    singleTokenFranchiseQuery,
    queryHasNumericToken: queryContext.queryNumericTokens.length > 0,
    looseQueryTokenSet: queryContext.looseQueryTokenSet,
    queryHasDerivativeIntent: queryHasDerivativeIntent(
      queryContext.looseQueryTokenSet,
    ),
    noisePenalties,
  };
  const ranked = results.map((result) =>
    scoreResult(
      result,
      queryContext,
      intentMode,
      rankingV2Enabled,
      scoringOptions,
    ),
  );
  const sorted = ranked.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    const byName = left.result.name.localeCompare(right.result.name);
    if (byName !== 0) {
      return byName;
    }

    return left.result.id.localeCompare(right.result.id);
  });

  if (intentMode !== "specific") {
    return sorted;
  }

  return applySpecificDerivativeSubtitleCap(sorted, queryContext.queryTokens);
}

function scoreResult(
  result: TitleSummary,
  queryContext: SearchQueryContext,
  intentMode: QueryIntentMode,
  rankingV2Enabled: boolean,
  scoringOptions: ScoringRunOptions,
): RankedSearchResult {
  const normalizedQuery = queryContext.normalizedQuery;
  const queryTokens = queryContext.queryTokens;
  const queryTokenSet = queryContext.queryTokenSet;
  const looseQueryTokens = queryContext.looseQueryTokens;
  const looseQueryTokenSet = queryContext.looseQueryTokenSet;
  const queryNumericTokens = queryContext.queryNumericTokens;
  const normalizedNameForNoise = normalizeSearchKey(result.name);
  const normalizedName = toCanonicalSearchKey(result.name);
  const nameTokens = tokenizeSearchKey(result.name);
  const subtitleParts = splitDerivativeSubtitle(result.name);
  const looseNameTokens = toLooseComparableTokens(nameTokens);
  const nameTokenSet = new Set(nameTokens);
  const looseNameTokenSet = new Set(looseNameTokens);
  const matchedTokens = queryTokens.filter((token) =>
    nameTokenSet.has(token),
  ).length;
  const looseMatchedTokens = looseQueryTokens.filter((token) =>
    looseNameTokenSet.has(token),
  ).length;
  const effectiveMatchedTokens = Math.max(matchedTokens, looseMatchedTokens);
  const coverage =
    queryTokens.length > 0 ? effectiveMatchedTokens / queryTokens.length : 0;
  const looseNormalizedQuery = looseQueryTokens.join(" ");
  const looseNormalizedName = looseNameTokens.join(" ");
  const includesExactQuery =
    normalizedName.includes(normalizedQuery) ||
    (looseNormalizedQuery.length > 0 &&
      looseNormalizedName.includes(looseNormalizedQuery));
  const startsWithQuery =
    normalizedName.startsWith(normalizedQuery) ||
    stripLeadingArticle(normalizedName).startsWith(normalizedQuery) ||
    stripLeadingPossessivePrefix(normalizedName).startsWith(normalizedQuery) ||
    (looseNormalizedQuery.length > 0 &&
      (looseNormalizedName.startsWith(looseNormalizedQuery) ||
        stripLeadingArticle(looseNormalizedName).startsWith(
          looseNormalizedQuery,
        ) ||
        stripLeadingPossessivePrefix(looseNormalizedName).startsWith(
          looseNormalizedQuery,
        )));
  const exactMatch =
    normalizedName === normalizedQuery ||
    (looseNormalizedQuery.length > 0 &&
      looseNormalizedName === looseNormalizedQuery);
  const singleTokenFranchiseQuery = scoringOptions.singleTokenFranchiseQuery;
  const exactMatchPoints = singleTokenFranchiseQuery
    ? searchRankingTuning.lexical.exactMatchPoints.broadSingleToken
    : searchRankingTuning.lexical.exactMatchPoints.specific;
  const startsWithPoints = singleTokenFranchiseQuery
    ? searchRankingTuning.lexical.startsWithPoints.broadSingleToken
    : searchRankingTuning.lexical.startsWithPoints.specific;
  const includesPoints = singleTokenFranchiseQuery
    ? searchRankingTuning.lexical.includesPoints.broadSingleToken
    : searchRankingTuning.lexical.includesPoints.specific;

  let score = 0;

  if (exactMatch) score += exactMatchPoints;
  else if (startsWithQuery) score += startsWithPoints;
  else if (includesExactQuery) score += includesPoints;

  if (effectiveMatchedTokens === queryTokens.length && queryTokens.length > 0) {
    score += searchRankingTuning.lexical.fullTokenCoverageBonus;
  }
  score += Math.round(coverage * searchRankingTuning.lexical.coverageScale);

  const extraTokenCount = nameTokens.filter(
    (token) => !queryTokenSet.has(token),
  ).length;
  const looseExtraTokenCount = looseNameTokens.filter(
    (token) => !looseQueryTokenSet.has(token),
  ).length;
  if (extraTokenCount > 0) {
    score -=
      Math.min(
        Math.min(extraTokenCount, looseExtraTokenCount),
        searchRankingTuning.lexical.extraTokenPenalty.maxTokens,
      ) *
      (intentMode === "specific"
        ? searchRankingTuning.lexical.extraTokenPenalty.specificPerToken
        : searchRankingTuning.lexical.extraTokenPenalty.broadPerToken);
  }

  const hasEditionSuffix = EDITION_SUFFIX_PATTERN.test(normalizedName);
  if (hasEditionSuffix) {
    score -= searchRankingTuning.lexical.editionSuffixPenalty;
  } else {
    score += searchRankingTuning.lexical.nonEditionBonus;
  }

  const qualityScore = computeProviderQualityComposite(result);
  const isWebOnly =
    result.platforms.length > 0 &&
    result.platforms.every((platform) => {
      const platformName = platform.name.toLowerCase();
      return platformName.includes("web") || platformName.includes("browser");
    });
  const hasMainstreamPlatformSignal = hasMainstreamPlatform(result);
  const derivativeEvaluation =
    intentMode === "specific"
      ? evaluateSpecificDerivativeSubtitleResult({
          result,
          queryTokens,
          looseQueryTokens,
          looseQueryTokenSet,
          exactMatch,
          includesExactQuery,
          coverage,
          qualityScore,
          hasMainstreamPlatformSignal,
          subtitleParts,
        })
      : null;

  if (
    intentMode === "specific" &&
    coverage < searchRankingTuning.lexicalConfidence.mediumCoverage &&
    !includesExactQuery
  ) {
    score -= searchRankingTuning.lexical.specificLowCoveragePenalty;
  }
  score += computePlatformRelevanceAdjustment(
    result,
    queryTokenSet,
    intentMode,
    hasMainstreamPlatformSignal,
    isWebOnly,
  );
  score += computeNoisePenalty(
    normalizedNameForNoise,
    queryTokenSet,
    scoringOptions.noisePenalties,
  );
  score += computeSpecificDerivativeSubtitlePenalty(
    intentMode,
    extraTokenCount,
    derivativeEvaluation,
  );
  score += computeSpecificMainlineSequelBoost(
    intentMode,
    includesExactQuery,
    coverage,
    scoringOptions.queryHasNumericToken,
    scoringOptions.queryHasDerivativeIntent,
    scoringOptions.looseQueryTokenSet,
    subtitleParts !== null,
    nameTokens,
  );
  score += computeSingleTokenFranchiseAdjustment(
    normalizedName,
    normalizedQuery,
    singleTokenFranchiseQuery,
    qualityScore,
    hasMainstreamPlatformSignal,
    result.name,
  );
  score += computeMetadataQualityAdjustment(result, intentMode);
  score += computeProviderQualityScore(
    result,
    intentMode,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
    rankingV2Enabled,
  );
  score += computeBroadLowSignalAdjustment(
    intentMode,
    exactMatch,
    startsWithQuery,
    qualityScore,
    isWebOnly,
  );
  score += computeBroadRecencyBoost(
    result,
    intentMode,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
    qualityScore,
    hasMainstreamPlatformSignal,
  );
  score += computeNumericIntentAdjustment(
    nameTokenSet,
    queryNumericTokens,
    intentMode,
  );

  return {
    result,
    score,
    coverage,
    exactMatch,
    includesExactQuery,
    extraTokenCount,
    qualityScore,
    hasMainstreamPlatform: hasMainstreamPlatformSignal,
    isWebOnly,
    derivativeEvaluation,
  };
}

function computePlatformRelevanceAdjustment(
  result: TitleSummary,
  queryTokenSet: Set<string>,
  intentMode: QueryIntentMode,
  hasMainstreamPlatformSignal: boolean,
  isWebOnlySignal: boolean,
) {
  const platformNames = result.platforms
    .map((platform) => platform.name.toLowerCase().trim())
    .filter((name) => name.length > 0);
  if (platformNames.length === 0) {
    return intentMode === "specific"
      ? -searchRankingTuning.platformRelevance.missingPlatformPenalty.specific
      : -searchRankingTuning.platformRelevance.missingPlatformPenalty.broad;
  }

  if (isWebOnlySignal) {
    const querySignalsWebIntent = [...WEB_INTENT_TOKEN_SET].some((token) =>
      queryTokenSet.has(token),
    );

    if (querySignalsWebIntent) {
      return intentMode === "specific"
        ? -searchRankingTuning.platformRelevance.webIntentPenalty.specific
        : -searchRankingTuning.platformRelevance.webIntentPenalty.broad;
    }

    return intentMode === "specific"
      ? -searchRankingTuning.platformRelevance.webOnlyPenalty.specific
      : -searchRankingTuning.platformRelevance.webOnlyPenalty.broad;
  }

  if (hasMainstreamPlatformSignal) {
    return searchRankingTuning.platformRelevance.mainstreamPlatformBonus;
  }

  return 0;
}

function computeNumericIntentAdjustment(
  nameTokenSet: Set<string>,
  queryNumericTokens: string[],
  intentMode: QueryIntentMode,
) {
  if (intentMode !== "specific" || queryNumericTokens.length === 0) {
    return 0;
  }

  const hasEveryRequestedNumber = queryNumericTokens.every((token) =>
    nameTokenSet.has(token),
  );
  if (!hasEveryRequestedNumber) {
    return -searchRankingTuning.numericIntent.missingRequestedNumberPenalty;
  }

  const hasOtherNumbers = [...nameTokenSet].some(
    (token) => /^[0-9]+$/.test(token) && !queryNumericTokens.includes(token),
  );
  if (hasOtherNumbers) {
    return -searchRankingTuning.numericIntent.otherNumberPenalty;
  }

  return searchRankingTuning.numericIntent.exactNumberBonus;
}

function computeMetadataQualityAdjustment(
  result: TitleSummary,
  intentMode: QueryIntentMode,
) {
  let score = 0;

  if (result.earliestReleaseDate) {
    score +=
      intentMode === "specific"
        ? searchRankingTuning.metadataQuality.releaseDateBonus.specific
        : searchRankingTuning.metadataQuality.releaseDateBonus.broad;
  } else {
    score -=
      intentMode === "specific"
        ? searchRankingTuning.metadataQuality.missingReleaseDatePenalty.specific
        : searchRankingTuning.metadataQuality.missingReleaseDatePenalty.broad;
  }

  const platformCount = result.platforms.length;
  if (platformCount === 0) {
    score -=
      intentMode === "specific"
        ? searchRankingTuning.metadataQuality.missingPlatformPenalty.specific
        : searchRankingTuning.metadataQuality.missingPlatformPenalty.broad;
  } else if (platformCount === 1) {
    score -=
      intentMode === "specific"
        ? searchRankingTuning.metadataQuality.singlePlatformPenalty.specific
        : searchRankingTuning.metadataQuality.singlePlatformPenalty.broad;
  } else {
    score += Math.min(
      platformCount *
        searchRankingTuning.metadataQuality.platformCountBonusPerPlatform,
      searchRankingTuning.metadataQuality.platformCountBonusCap,
    );
  }

  if (result.coverImageUrl) {
    score += searchRankingTuning.metadataQuality.hasCoverImageBonus;
  } else {
    score -= searchRankingTuning.metadataQuality.missingCoverImagePenalty;
  }

  return score;
}

function computeNoisePenalty(
  normalizedName: string,
  queryTokenSet: Set<string>,
  penalties: ReadonlyArray<{ keyword: string; points: number }> | null,
) {
  if (!penalties || penalties.length === 0) {
    return 0;
  }

  let score = 0;
  for (const penalty of penalties) {
    if (
      normalizedName.includes(penalty.keyword) &&
      !queryTokenSet.has(penalty.keyword)
    ) {
      score += penalty.points;
    }
  }

  return score;
}

function computeSingleTokenFranchiseAdjustment(
  normalizedName: string,
  normalizedQuery: string,
  singleTokenFranchiseQuery: boolean,
  qualityScore: number,
  hasMainstreamPlatformSignal: boolean,
  resultName: string,
) {
  if (!singleTokenFranchiseQuery) {
    return 0;
  }

  let score = 0;
  const brandedPrefixName = stripLeadingPossessivePrefix(normalizedName);
  if (
    brandedPrefixName.startsWith(normalizedQuery) &&
    !normalizedName.startsWith(normalizedQuery)
  ) {
    score += searchRankingTuning.singleTokenFranchise.brandedPrefixBonus;
  }

  if (
    qualityScore >=
    searchRankingTuning.singleTokenFranchise.highQualityThreshold
  ) {
    score += Math.round(
      qualityScore * searchRankingTuning.singleTokenFranchise.highQualityScale,
    );
  } else if (
    qualityScore <= searchRankingTuning.singleTokenFranchise.lowQualityThreshold
  ) {
    score -= searchRankingTuning.singleTokenFranchise.lowQualityPenalty;
  }

  if (
    normalizedName === normalizedQuery &&
    qualityScore <
      searchRankingTuning.singleTokenFranchise.weakExactQualityThreshold &&
    !hasMainstreamPlatformSignal
  ) {
    score -= searchRankingTuning.singleTokenFranchise.weakExactPenalty;
  }

  if (/\([^)]*\)/.test(resultName)) {
    score -= searchRankingTuning.singleTokenFranchise.parentheticalPenalty;
  }

  return score;
}

export function rankResultsForTesting(
  results: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  rankingV2Enabled = true,
) {
  return rankResults(results, query, intentMode, rankingV2Enabled).map(
    (entry) => entry.result,
  );
}

export function getLocalPolicyPageCount(
  localResults: TitleSummary[],
  query: string,
  intentMode: QueryIntentMode,
  page: number,
  limit: number,
) {
  return mergeResults(localResults, [], query, intentMode, page, limit).results
    .length;
}

function stripLeadingArticle(value: string) {
  return value.replace(/^(?:the|a|an)\s+/, "");
}

function stripLeadingPossessivePrefix(value: string) {
  return value.replace(/^[a-z0-9]+s\s+/, "");
}

function isSingleTokenFranchiseQuery(
  queryTokens: string[],
  intentMode: QueryIntentMode,
) {
  return intentMode === "broad" && queryTokens.length === 1;
}

function computeProviderQualityScore(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
  rankingV2Enabled: boolean,
) {
  if (!rankingV2Enabled) {
    return computeProviderQualityAdjustment(
      result,
      intentMode,
      coverage,
      includesExactQuery,
    );
  }

  return computeProviderQualityAdjustmentV2(
    result,
    intentMode,
    toLexicalConfidence(
      coverage,
      includesExactQuery,
      exactMatch,
      startsWithQuery,
    ),
  );
}

function toLexicalConfidence(
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
): LexicalConfidence {
  const highCoverageThreshold =
    searchRankingTuning.lexicalConfidence.highCoverage;
  const mediumCoverageThreshold =
    searchRankingTuning.lexicalConfidence.mediumCoverage;

  if (
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery && coverage >= highCoverageThreshold)
  ) {
    return LEXICAL_CONFIDENCE.HIGH;
  }

  if (includesExactQuery || coverage >= mediumCoverageThreshold) {
    return LEXICAL_CONFIDENCE.MEDIUM;
  }

  return LEXICAL_CONFIDENCE.LOW;
}
