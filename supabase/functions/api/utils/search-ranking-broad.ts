import type { QueryIntentMode } from "../contracts/search.ts";
import type { TitleSummary } from "../types.ts";
import { searchRankingTuning } from "./search-ranking-tuning.ts";

interface BroadFranchiseEntry {
  result: TitleSummary;
  extraTokenCount: number;
  qualityScore: number;
  includesExactQuery: boolean;
}

export function applyBroadFranchiseDenoise<T extends BroadFranchiseEntry>(
  results: T[],
  limit: number,
) {
  const prunedResults = results.filter(
    (result) => !isLowQualityBroadFranchiseTail(result),
  );
  const minimumRetained = Math.min(
    searchRankingTuning.broad.denoise.minimumRetainedCap,
    limit,
  );
  if (
    prunedResults.length >= minimumRetained &&
    prunedResults.length < results.length
  ) {
    return prunedResults;
  }

  return results;
}

function isLowQualityBroadFranchiseTail(result: BroadFranchiseEntry) {
  const hasExtraTokens = result.extraTokenCount > 0;
  const ratingsCount = result.result.rawgRatingsCount ?? 0;
  const addedCount = result.result.rawgAdded ?? 0;
  const reviewsCount = result.result.rawgReviewsCount ?? 0;
  const veryLowEngagement =
    ratingsCount <
      searchRankingTuning.broad.denoise.veryLowEngagementRatingsCount &&
    addedCount < searchRankingTuning.broad.denoise.veryLowEngagementAdded &&
    reviewsCount <
      searchRankingTuning.broad.denoise.veryLowEngagementReviewsCount;
  const lowQuality =
    result.qualityScore < searchRankingTuning.broad.denoise.lowQualityThreshold;
  const highConfidenceLexicalAnchor =
    result.includesExactQuery && result.extraTokenCount === 0;

  if (highConfidenceLexicalAnchor) {
    return false;
  }

  if (isAnticipationProtected(result.result)) {
    return false;
  }

  if (veryLowEngagement && hasExtraTokens) {
    return true;
  }

  return lowQuality && hasExtraTokens;
}

export function isAnticipationProtected(result: TitleSummary) {
  if (!hasMainstreamPlatform(result)) {
    return false;
  }

  // Upcoming mainstream titles can have low current engagement but should not
  // be dropped from broad franchise recall.
  if (isFutureReleaseDate(result.earliestReleaseDate)) {
    return true;
  }

  const hasStrongPopularitySignal =
    (result.rawgAdded ?? 0) >=
      searchRankingTuning.anticipationProtection.strongPopularityAdded ||
    (result.rawgRatingsCount ?? 0) >=
      searchRankingTuning.anticipationProtection.strongPopularityRatingsCount;
  if (!hasStrongPopularitySignal) {
    return false;
  }

  return hasRecentMajorTitleSignal(result);
}

function isFutureReleaseDate(value: string | null) {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) {
    return false;
  }

  return releaseDate.getTime() > Date.now();
}

function hasRecentMajorTitleSignal(result: TitleSummary) {
  const hasMajorQualitySignals =
    (result.rawgMetacritic ?? 0) >=
      searchRankingTuning.anticipationProtection.majorQualityMetacritic ||
    (result.rawgRating ?? 0) >=
      searchRankingTuning.anticipationProtection.majorQualityRating;
  const hasMajorEngagementSignals =
    (result.rawgRatingsCount ?? 0) >=
      searchRankingTuning.anticipationProtection.majorEngagementRatingsCount ||
    (result.rawgAdded ?? 0) >=
      searchRankingTuning.anticipationProtection.majorEngagementAdded;

  if (!hasMajorQualitySignals || !hasMajorEngagementSignals) {
    return false;
  }

  if (!result.earliestReleaseDate) {
    return true;
  }

  const releaseDate = parseReleaseDate(result.earliestReleaseDate);
  if (!releaseDate) {
    return true;
  }

  const eightYearsMs =
    searchRankingTuning.anticipationProtection.recentMajorYears *
    365 *
    24 *
    60 *
    60 *
    1000;
  return Date.now() - releaseDate.getTime() <= eightYearsMs;
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const releaseDate = new Date(value);
  if (!Number.isFinite(releaseDate.getTime())) {
    return null;
  }

  return releaseDate;
}

export function computeBroadLowSignalAdjustment(
  intentMode: QueryIntentMode,
  exactMatch: boolean,
  startsWithQuery: boolean,
  qualityScore: number,
  isWebOnly: boolean,
) {
  if (intentMode !== "broad") {
    return 0;
  }

  if (
    exactMatch &&
    qualityScore <= searchRankingTuning.broad.lowSignal.exactQualityThreshold
  ) {
    return isWebOnly
      ? -searchRankingTuning.broad.lowSignal.exactWebPenalty
      : -searchRankingTuning.broad.lowSignal.exactPenalty;
  }

  if (
    exactMatch &&
    isWebOnly &&
    qualityScore <
      searchRankingTuning.broad.lowSignal.exactWebMidQualityThreshold
  ) {
    return -searchRankingTuning.broad.lowSignal.exactWebMidQualityPenalty;
  }

  if (
    startsWithQuery &&
    qualityScore <=
      searchRankingTuning.broad.lowSignal.startsWithQualityThreshold
  ) {
    return isWebOnly
      ? -searchRankingTuning.broad.lowSignal.startsWithWebPenalty
      : -searchRankingTuning.broad.lowSignal.startsWithPenalty;
  }

  return 0;
}

export function computeBroadRecencyBoost(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
  qualityScore: number,
  mainstreamPlatform: boolean,
) {
  if (intentMode !== "broad") {
    return 0;
  }

  const hasLexicalAnchor =
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery &&
      coverage >=
        searchRankingTuning.broad.recency.lexicalAnchorCoverageMedium) ||
    coverage >= searchRankingTuning.broad.recency.lexicalAnchorCoverageStrong;
  if (!hasLexicalAnchor) {
    return 0;
  }

  if (
    qualityScore <
      searchRankingTuning.broad.recency.lowQualityWithoutMainstreamThreshold &&
    !mainstreamPlatform
  ) {
    return 0;
  }

  const releaseDate = parseReleaseDate(result.earliestReleaseDate);
  if (!releaseDate) {
    return 0;
  }

  const oneDayMs = searchRankingTuning.broad.recency.oneDayMs;
  const daysFromNow = Math.round(
    (releaseDate.getTime() - Date.now()) / oneDayMs,
  );
  if (daysFromNow > 0) {
    if (
      daysFromNow <=
      365 * searchRankingTuning.broad.recency.nearFutureYears
    ) {
      return mainstreamPlatform
        ? searchRankingTuning.broad.recency.nearFutureMainstreamBonus
        : searchRankingTuning.broad.recency.nearFutureOtherBonus;
    }

    return mainstreamPlatform
      ? searchRankingTuning.broad.recency.farFutureMainstreamBonus
      : searchRankingTuning.broad.recency.farFutureOtherBonus;
  }

  const daysSinceRelease = Math.abs(daysFromNow);
  if (
    daysSinceRelease <=
    365 * searchRankingTuning.broad.recency.recentPastYears
  ) {
    return searchRankingTuning.broad.recency.recentPastBonus;
  }

  if (
    daysSinceRelease <=
    365 * searchRankingTuning.broad.recency.mediumPastYears
  ) {
    return searchRankingTuning.broad.recency.mediumPastBonus;
  }

  if (
    daysSinceRelease <=
    365 * searchRankingTuning.broad.recency.olderPastYears
  ) {
    return searchRankingTuning.broad.recency.olderPastBonus;
  }

  return 0;
}

export function hasMainstreamPlatform(result: TitleSummary) {
  return result.platforms.some((platform) => {
    const name = platform.name.toLowerCase();
    return (
      name.includes("pc") ||
      name.includes("playstation") ||
      name.includes("xbox") ||
      name.includes("nintendo") ||
      name.includes("switch")
    );
  });
}
