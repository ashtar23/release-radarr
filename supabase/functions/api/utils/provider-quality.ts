import type { TitleSummary } from "../types.ts";

export type QueryIntentMode = "broad" | "specific";
export type LexicalConfidence = "high" | "medium" | "low";

const QUALITY_BASE_POINTS: Record<QueryIntentMode, number> = {
  specific: 380,
  broad: 260,
};

const V2_CONFIDENCE_MULTIPLIER: Record<LexicalConfidence, number> = {
  high: 1,
  medium: 0.4,
  low: 0.1,
};

const V2_CONFIDENCE_CAP: Record<LexicalConfidence, number> = {
  high: Number.POSITIVE_INFINITY,
  medium: 180,
  low: 30,
};

export function computeProviderQualityAdjustment(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  coverage: number,
  includesExactQuery: boolean,
) {
  const qualityScore = computeProviderQualityComposite(result);
  if (qualityScore <= 0) {
    return 0;
  }

  const baseMaxPoints = QUALITY_BASE_POINTS[intentMode];
  const fullPoints = Math.round(baseMaxPoints * qualityScore);
  if (includesExactQuery || coverage >= 0.66) {
    return fullPoints;
  }

  if (coverage >= 0.5) {
    return Math.round(fullPoints * 0.5);
  }

  return Math.min(fullPoints, 40);
}

export function computeProviderQualityAdjustmentV2(
  result: TitleSummary,
  intentMode: QueryIntentMode,
  lexicalConfidence: LexicalConfidence,
) {
  const hasQualitySignals = hasAnyQualitySignal(result);
  if (!hasQualitySignals) {
    return 0;
  }

  const qualityScore = computeProviderQualityComposite(result);
  if (qualityScore <= 0) {
    return 0;
  }

  if (qualityScore <= 0.18) {
    return intentMode === "specific" ? -220 : -120;
  }

  const fullPoints = Math.round(QUALITY_BASE_POINTS[intentMode] * qualityScore);
  const adjusted = Math.round(fullPoints * V2_CONFIDENCE_MULTIPLIER[lexicalConfidence]);
  return Math.min(adjusted, V2_CONFIDENCE_CAP[lexicalConfidence]);
}

export function computeProviderQualityComposite(result: TitleSummary) {
  const metacriticNorm = normalizeRange(result.rawgMetacritic, 100);
  const ratingNorm = normalizeRange(result.rawgRating, 5);
  const ratingsCountNorm = normalizeLogCount(result.rawgRatingsCount, 6);
  const addedNorm = normalizeLogCount(result.rawgAdded, 6);
  const reviewsNorm = normalizeLogCount(result.rawgReviewsCount, 5);
  const suggestionsNorm = normalizeLogCount(result.rawgSuggestionsCount, 5);
  const ratingTopNorm = normalizeRange(result.rawgRatingTop, 5);

  return clamp(
    metacriticNorm * 0.34 +
      ratingNorm * 0.26 +
      ratingsCountNorm * 0.20 +
      addedNorm * 0.12 +
      reviewsNorm * 0.05 +
      suggestionsNorm * 0.02 +
      ratingTopNorm * 0.01,
    0,
    1,
  );
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

function hasAnyQualitySignal(result: TitleSummary) {
  return (
    result.rawgMetacritic !== null ||
    result.rawgRating !== null ||
    result.rawgRatingsCount !== null ||
    result.rawgAdded !== null ||
    result.rawgReviewsCount !== null ||
    result.rawgSuggestionsCount !== null ||
    result.rawgRatingTop !== null
  );
}
