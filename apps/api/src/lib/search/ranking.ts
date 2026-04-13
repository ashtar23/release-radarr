import type { TitleSummary } from "@repo/types";

import {
  BROAD_LOW_QUALITY_THRESHOLD,
  EDITION_TERMS,
  NOISE_KEYWORD_PENALTIES,
  PARENTHETICAL_NOISE_TOKENS,
  STRONG_COVERAGE_THRESHOLD,
  TRUSTED_DEVELOPERS,
  TRUSTED_PUBLISHERS,
} from "./constants";
import { normalizeSearchKey, tokenizeSearchKey } from "./normalize";
import type {
  RankedSearchCandidate,
  SearchContext,
  SearchIntentMode,
  SearchScore,
} from "./types";

export function rankResults(
  results: RankedSearchCandidate[],
  context: SearchContext,
) {
  return [...results].sort((left, right) => {
    const rightScore = calculateSearchScore(right, context);
    const leftScore = calculateSearchScore(left, context);
    const scoreDifference = rightScore.total - leftScore.total;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const qualityDifference = rightScore.qualityScore - leftScore.qualityScore;
    if (qualityDifference !== 0) {
      return qualityDifference;
    }

    const metacriticDifference =
      (right.summary.rawgMetacritic ?? -1) -
      (left.summary.rawgMetacritic ?? -1);
    if (metacriticDifference !== 0) {
      return metacriticDifference;
    }

    const ratingsDifference =
      (right.summary.rawgRatingsCount ?? -1) -
      (left.summary.rawgRatingsCount ?? -1);
    if (ratingsDifference !== 0) {
      return ratingsDifference;
    }

    const addedDifference =
      (right.summary.rawgAdded ?? -1) - (left.summary.rawgAdded ?? -1);
    if (addedDifference !== 0) {
      return addedDifference;
    }

    return left.summary.name.localeCompare(right.summary.name);
  });
}

function calculateSearchScore(
  candidate: RankedSearchCandidate,
  context: SearchContext,
): SearchScore {
  const summary = candidate.summary;
  const normalizedName = normalizeSearchKey(summary.name);
  const nameTokens = normalizedName.split(" ").filter(Boolean);
  const nameTokenSet = new Set(nameTokens);
  const matchedTokenCount = context.queryTokens.filter((token) =>
    nameTokenSet.has(token),
  ).length;
  const coverage =
    context.queryTokens.length === 0
      ? 0
      : matchedTokenCount / context.queryTokens.length;
  const exactMatch = normalizedName === context.normalizedQuery;
  const startsWithQuery = normalizedName.startsWith(context.normalizedQuery);
  const phraseIndex = normalizedName.indexOf(context.normalizedQuery);
  const includesExactQuery = phraseIndex >= 0;
  const extraTokenCount = Math.max(0, nameTokens.length - matchedTokenCount);
  const futureRelease = isFutureReleaseDate(summary.earliestReleaseDate);
  const qualityScore = computeProviderQualityComposite(summary);
  const mainstreamPlatform = hasMainstreamPlatform(summary.platforms);
  const webOnlyPlatform = isWebOnlyPlatform(summary.platforms);

  let total = 0;
  total += computeLexicalScore({
    context,
    coverage,
    exactMatch,
    startsWithQuery,
    includesExactQuery,
    phraseIndex,
    extraTokenCount,
  });
  total += computeMetadataQualityAdjustment(summary, context.intentMode);
  total += computeProviderQualityAdjustment(
    summary,
    context.intentMode,
    coverage,
    includesExactQuery,
  );
  total += computeTrustedMetadataBoost(candidate, coverage, includesExactQuery);
  total += computePlatformAdjustment(
    summary.platforms,
    context,
    mainstreamPlatform,
    webOnlyPlatform,
  );
  total += computeBroadRecencyBoost(
    summary,
    context,
    coverage,
    includesExactQuery,
    exactMatch,
    startsWithQuery,
    qualityScore,
    mainstreamPlatform,
  );
  total += computeBroadFranchiseTitleBoost({
    summary,
    context,
    coverage,
    includesExactQuery,
    phraseIndex,
    extraTokenCount,
    qualityScore,
    mainstreamPlatform,
    futureRelease,
  });
  total += computeBroadBareTitlePenalty({
    summary,
    context,
    exactMatch,
    extraTokenCount,
    qualityScore,
    mainstreamPlatform,
    futureRelease,
  });
  total += computeBroadLowSignalAdjustment({
    context,
    qualityScore,
    exactMatch,
    startsWithQuery,
    includesExactQuery,
    extraTokenCount,
    mainstreamPlatform,
    webOnlyPlatform,
    summary,
  });
  total += computeNoisePenalty(summary.name, context);
  total += computeEditionPenalty(normalizedName, context);
  total += computeParentheticalNoisePenalty(summary.name, context);

  return {
    total,
    qualityScore,
  };
}

function computeBroadFranchiseTitleBoost(params: {
  summary: TitleSummary;
  context: SearchContext;
  coverage: number;
  includesExactQuery: boolean;
  phraseIndex: number;
  extraTokenCount: number;
  qualityScore: number;
  mainstreamPlatform: boolean;
  futureRelease: boolean;
}) {
  if (params.context.intentMode !== "broad") {
    return 0;
  }

  if (params.coverage < 1 || !params.includesExactQuery) {
    return 0;
  }

  if (params.extraTokenCount < 1 || params.extraTokenCount > 4) {
    return 0;
  }

  let total = 0;
  const hasBrandPrefix = params.phraseIndex > 0 && params.phraseIndex <= 16;
  const popularitySignal = Math.max(
    Math.min((params.summary.rawgAdded ?? 0) / 4000, 1),
    Math.min((params.summary.rawgRatingsCount ?? 0) / 600, 1),
  );

  if (hasBrandPrefix) {
    total += 180;
  }

  if (params.mainstreamPlatform) {
    total += 80;
  }

  if (params.futureRelease && params.mainstreamPlatform) {
    total += 280;
  }

  total += Math.round(Math.min(params.qualityScore, 0.7) * 220);
  total += Math.round(popularitySignal * 180);

  return total;
}

function computeBroadBareTitlePenalty(params: {
  summary: TitleSummary;
  context: SearchContext;
  exactMatch: boolean;
  extraTokenCount: number;
  qualityScore: number;
  mainstreamPlatform: boolean;
  futureRelease: boolean;
}) {
  if (params.context.intentMode !== "broad") {
    return 0;
  }

  if (!params.exactMatch || params.extraTokenCount !== 0) {
    return 0;
  }

  if (params.futureRelease) {
    return 0;
  }

  let total = 0;

  if (!params.mainstreamPlatform) {
    total -= 180;
  }

  if (hasVeryLowEngagement(params.summary)) {
    total -= 260;
  }

  if (params.qualityScore < 0.22) {
    total -= 120;
  }

  const releaseDate = parseReleaseDate(params.summary.earliestReleaseDate);
  if (releaseDate) {
    const ageInYears =
      (Date.now() - releaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    if (ageInYears >= 15) {
      total -= 80;
    }
  }

  return total;
}

function computeLexicalScore(params: {
  context: SearchContext;
  coverage: number;
  exactMatch: boolean;
  startsWithQuery: boolean;
  includesExactQuery: boolean;
  phraseIndex: number;
  extraTokenCount: number;
}) {
  let total = 0;

  if (params.exactMatch) {
    total += params.context.intentMode === "specific" ? 1200 : 720;
  } else if (params.startsWithQuery) {
    total += params.context.intentMode === "specific" ? 800 : 540;
  } else if (params.includesExactQuery) {
    total += params.context.intentMode === "specific" ? 350 : 300;
    total -= Math.min(params.phraseIndex, 50) * 2;
  }

  if (params.coverage === 1) {
    total += 320;
  }

  total += Math.round(params.coverage * 220);
  total -=
    Math.min(params.extraTokenCount, 10) *
    (params.context.intentMode === "specific" ? 44 : 16);

  if (params.context.intentMode === "specific" && params.coverage < 0.5) {
    total -= 240;
  }

  return total;
}

function computeMetadataQualityAdjustment(
  summary: TitleSummary,
  intentMode: SearchIntentMode,
) {
  let total = 0;

  total += summary.earliestReleaseDate
    ? intentMode === "specific"
      ? 80
      : 20
    : intentMode === "specific"
      ? -220
      : -50;

  if (summary.platforms.length === 0) {
    total -= intentMode === "specific" ? 140 : 30;
  } else if (summary.platforms.length === 1) {
    total -= intentMode === "specific" ? 60 : 10;
  } else {
    total += Math.min(summary.platforms.length * 28, 112);
  }

  total += summary.coverImageUrl ? 12 : -24;
  return total;
}

function computeProviderQualityAdjustment(
  summary: TitleSummary,
  intentMode: SearchIntentMode,
  coverage: number,
  includesExactQuery: boolean,
) {
  const qualityScore = computeProviderQualityComposite(summary);
  if (qualityScore <= 0) {
    return 0;
  }

  const basePoints = intentMode === "specific" ? 380 : 260;
  const fullPoints = Math.round(basePoints * qualityScore);
  if (includesExactQuery || coverage >= STRONG_COVERAGE_THRESHOLD) {
    return fullPoints;
  }

  if (coverage >= 0.5) {
    return Math.round(fullPoints * 0.5);
  }

  return Math.min(fullPoints, 40);
}

function computeProviderQualityComposite(summary: TitleSummary) {
  const metacriticNorm = normalizeRange(summary.rawgMetacritic, 100);
  const ratingNorm = normalizeRange(summary.rawgRating, 5);
  const ratingsCountNorm = normalizeLogCount(summary.rawgRatingsCount, 6);
  const addedNorm = normalizeLogCount(summary.rawgAdded, 6);
  const reviewsNorm = normalizeLogCount(summary.rawgReviewsCount, 5);
  const suggestionsNorm = normalizeLogCount(summary.rawgSuggestionsCount, 5);
  const ratingTopNorm = normalizeRange(summary.rawgRatingTop, 5);

  return clamp(
    metacriticNorm * 0.34 +
      ratingNorm * 0.26 +
      ratingsCountNorm * 0.2 +
      addedNorm * 0.12 +
      reviewsNorm * 0.05 +
      suggestionsNorm * 0.02 +
      ratingTopNorm * 0.01,
    0,
    1,
  );
}

function computeTrustedMetadataBoost(
  candidate: RankedSearchCandidate,
  coverage: number,
  includesExactQuery: boolean,
) {
  if (!includesExactQuery && coverage < 0.5) {
    return 0;
  }

  let total = 0;
  if (
    candidate.developers
      .map(normalizeSearchKey)
      .some((name) => TRUSTED_DEVELOPERS.has(name))
  ) {
    total += 140;
  }

  if (
    candidate.publishers
      .map(normalizeSearchKey)
      .some((name) => TRUSTED_PUBLISHERS.has(name))
  ) {
    total += 120;
  }

  return Math.min(total, 220);
}

function computePlatformAdjustment(
  platforms: TitleSummary["platforms"],
  context: SearchContext,
  mainstreamPlatform: boolean,
  webOnlyPlatform: boolean,
) {
  let total = 0;

  if (mainstreamPlatform) {
    total += 60;
  }

  if (webOnlyPlatform) {
    total -= context.intentMode === "specific" ? 520 : 220;
  }

  if (
    context.intentMode === "specific" &&
    webOnlyPlatform &&
    !context.queryTokenSet.has("web") &&
    !context.queryTokenSet.has("browser")
  ) {
    total -= 40;
  }

  return total;
}

function computeBroadRecencyBoost(
  summary: TitleSummary,
  context: SearchContext,
  coverage: number,
  includesExactQuery: boolean,
  exactMatch: boolean,
  startsWithQuery: boolean,
  qualityScore: number,
  mainstreamPlatform: boolean,
) {
  if (context.intentMode !== "broad") {
    return 0;
  }

  const hasLexicalAnchor =
    exactMatch ||
    startsWithQuery ||
    (includesExactQuery && coverage >= 0.5) ||
    coverage >= STRONG_COVERAGE_THRESHOLD;
  if (!hasLexicalAnchor) {
    return 0;
  }

  if (qualityScore < 0.2 && !mainstreamPlatform) {
    return 0;
  }

  const releaseDate = parseReleaseDate(summary.earliestReleaseDate);
  if (!releaseDate) {
    return 0;
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysFromNow = Math.round(
    (releaseDate.getTime() - Date.now()) / oneDayMs,
  );
  if (daysFromNow > 0) {
    if (daysFromNow <= 365 * 3) {
      return mainstreamPlatform ? 180 : 90;
    }

    return mainstreamPlatform ? 130 : 65;
  }

  const daysSinceRelease = Math.abs(daysFromNow);
  if (daysSinceRelease <= 365 * 2) {
    return 120;
  }

  if (daysSinceRelease <= 365 * 5) {
    return 70;
  }

  if (daysSinceRelease <= 365 * 10) {
    return 35;
  }

  return 0;
}

function computeBroadLowSignalAdjustment(params: {
  context: SearchContext;
  qualityScore: number;
  exactMatch: boolean;
  startsWithQuery: boolean;
  includesExactQuery: boolean;
  extraTokenCount: number;
  mainstreamPlatform: boolean;
  webOnlyPlatform: boolean;
  summary: TitleSummary;
}) {
  if (params.context.intentMode !== "broad") {
    return 0;
  }

  if (params.includesExactQuery && params.extraTokenCount === 0) {
    return 0;
  }

  if (isAnticipationProtected(params.summary, params.mainstreamPlatform)) {
    return 0;
  }

  let total = 0;
  if (params.exactMatch && params.qualityScore <= 0.18) {
    total -= params.webOnlyPlatform ? 720 : 560;
  }

  if (params.startsWithQuery && params.qualityScore <= 0.12) {
    total -= params.webOnlyPlatform ? 320 : 180;
  }

  if (
    params.extraTokenCount > 0 &&
    (params.qualityScore < BROAD_LOW_QUALITY_THRESHOLD ||
      hasVeryLowEngagement(params.summary))
  ) {
    total -= 260;
  }

  return total;
}

function computeNoisePenalty(name: string, context: SearchContext) {
  const normalizedNameTokens = new Set(tokenizeSearchKey(name));
  let total = 0;

  for (const penalty of NOISE_KEYWORD_PENALTIES) {
    if (
      normalizedNameTokens.has(penalty.keyword) &&
      !context.queryTokenSet.has(penalty.keyword)
    ) {
      total += penalty.points;
    }
  }

  return total;
}

function computeEditionPenalty(normalizedName: string, context: SearchContext) {
  const hasEditionTerm = EDITION_TERMS.some((term) =>
    normalizedName.includes(term),
  );
  if (!hasEditionTerm) {
    return 40;
  }

  return context.includesEditionTerms ? 0 : -90;
}

function computeParentheticalNoisePenalty(
  name: string,
  context: SearchContext,
) {
  const matches = [...name.matchAll(/\(([^)]+)\)/g)];
  if (matches.length === 0) {
    return 0;
  }

  let total = 0;
  for (const match of matches) {
    const group = match[1];
    if (!group) {
      continue;
    }

    const groupTokens = normalizeSearchKey(group).split(" ").filter(Boolean);
    const isNoiseGroup = groupTokens.some((token) =>
      PARENTHETICAL_NOISE_TOKENS.has(token),
    );

    if (
      isNoiseGroup &&
      !groupTokens.some((token) => context.queryTokenSet.has(token))
    ) {
      total -= 120;
    }
  }

  return total;
}

function hasMainstreamPlatform(platforms: TitleSummary["platforms"]) {
  return platforms.some((platform) => {
    const name = normalizeSearchKey(platform.name);
    return (
      name.includes("pc") ||
      name.includes("playstation") ||
      name.includes("xbox") ||
      name.includes("nintendo") ||
      name.includes("switch")
    );
  });
}

function isWebOnlyPlatform(platforms: TitleSummary["platforms"]) {
  if (platforms.length === 0) {
    return false;
  }

  return platforms.every((platform) => {
    const name = normalizeSearchKey(platform.name);
    return (
      name.includes("web") ||
      name.includes("browser") ||
      name.includes("html5") ||
      name === "io"
    );
  });
}

function hasVeryLowEngagement(summary: TitleSummary) {
  return (
    (summary.rawgRatingsCount ?? 0) < 50 &&
    (summary.rawgAdded ?? 0) < 250 &&
    (summary.rawgReviewsCount ?? 0) < 25
  );
}

function isAnticipationProtected(
  summary: TitleSummary,
  mainstreamPlatform: boolean,
) {
  if (!mainstreamPlatform) {
    return false;
  }

  const hasStrongPopularitySignal =
    (summary.rawgAdded ?? 0) >= 8000 || (summary.rawgRatingsCount ?? 0) >= 1500;
  const hasMajorQualitySignals =
    (summary.rawgMetacritic ?? 0) >= 80 || (summary.rawgRating ?? 0) >= 4.2;
  const hasMajorEngagementSignals =
    (summary.rawgRatingsCount ?? 0) >= 1200 || (summary.rawgAdded ?? 0) >= 7000;

  if (isFutureReleaseDate(summary.earliestReleaseDate)) {
    return (
      hasMajorQualitySignals ||
      hasMajorEngagementSignals ||
      (summary.rawgAdded ?? 0) >= 2000 ||
      (summary.rawgRatingsCount ?? 0) >= 250
    );
  }

  if (!hasStrongPopularitySignal) {
    return false;
  }

  return hasMajorQualitySignals && hasMajorEngagementSignals;
}

function isFutureReleaseDate(value: string | null) {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) {
    return false;
  }

  return releaseDate.getTime() > Date.now();
}

function parseReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function normalizeRange(value: number | null, max: number) {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  return clamp(value / max, 0, 1);
}

function normalizeLogCount(value: number | null, logMax: number) {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return clamp(Math.log10(1 + value) / logMax, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
