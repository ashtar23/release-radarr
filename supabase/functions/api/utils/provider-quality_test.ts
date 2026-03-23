import {
  computeProviderQualityAdjustment,
  computeProviderQualityAdjustmentV2,
  computeProviderQualityComposite,
} from "./provider-quality.ts";
import type { TitleSummary } from "../types.ts";

const baseSummary: TitleSummary = {
  id: "rawg:test",
  kind: "game",
  source: "rawg",
  externalId: "test",
  slug: "test",
  name: "Test Game",
  coverImageUrl: null,
  earliestReleaseDate: null,
  platforms: [],
  rawgRating: null,
  rawgRatingsCount: null,
  rawgMetacritic: null,
  rawgAdded: null,
  rawgReviewsCount: null,
  rawgSuggestionsCount: null,
  rawgRatingTop: null,
};

Deno.test("computeProviderQualityComposite returns 0 when metadata is absent", () => {
  const score = computeProviderQualityComposite(baseSummary);
  if (score !== 0) {
    throw new Error(`Expected score=0, got ${score}`);
  }
});

Deno.test("computeProviderQualityComposite increases for stronger metadata", () => {
  const weak = {
    ...baseSummary,
    rawgRating: 2.8,
    rawgRatingsCount: 20,
    rawgMetacritic: 52,
    rawgAdded: 50,
  };
  const strong = {
    ...baseSummary,
    rawgRating: 4.7,
    rawgRatingsCount: 6000,
    rawgMetacritic: 93,
    rawgAdded: 20000,
    rawgReviewsCount: 1000,
    rawgSuggestionsCount: 1200,
    rawgRatingTop: 5,
  };

  const weakScore = computeProviderQualityComposite(weak);
  const strongScore = computeProviderQualityComposite(strong);
  if (!(strongScore > weakScore)) {
    throw new Error(
      `Expected strong score > weak score, got weak=${weakScore}, strong=${strongScore}`,
    );
  }
});

Deno.test("computeProviderQualityAdjustment applies relevance guardrails", () => {
  const strong = {
    ...baseSummary,
    rawgRating: 4.9,
    rawgRatingsCount: 8000,
    rawgMetacritic: 96,
    rawgAdded: 30000,
    rawgReviewsCount: 1200,
    rawgSuggestionsCount: 1400,
    rawgRatingTop: 5,
  };

  const lowCoverage = computeProviderQualityAdjustment(strong, "specific", 0.2, false);
  const mediumCoverage = computeProviderQualityAdjustment(
    strong,
    "specific",
    0.52,
    false,
  );
  const highCoverage = computeProviderQualityAdjustment(strong, "specific", 0.8, true);

  if (!(lowCoverage <= 40)) {
    throw new Error(`Expected low coverage adjustment to be capped, got ${lowCoverage}`);
  }
  if (!(mediumCoverage > lowCoverage)) {
    throw new Error(
      `Expected medium coverage > low coverage, got low=${lowCoverage}, medium=${mediumCoverage}`,
    );
  }
  if (!(highCoverage > mediumCoverage)) {
    throw new Error(
      `Expected high coverage > medium coverage, got medium=${mediumCoverage}, high=${highCoverage}`,
    );
  }
});

Deno.test("computeProviderQualityAdjustmentV2 gates quality by lexical confidence", () => {
  const strong = {
    ...baseSummary,
    rawgRating: 4.9,
    rawgRatingsCount: 8000,
    rawgMetacritic: 96,
    rawgAdded: 30000,
    rawgReviewsCount: 1200,
    rawgSuggestionsCount: 1400,
    rawgRatingTop: 5,
  };

  const high = computeProviderQualityAdjustmentV2(strong, "specific", "high");
  const medium = computeProviderQualityAdjustmentV2(strong, "specific", "medium");
  const low = computeProviderQualityAdjustmentV2(strong, "specific", "low");

  if (!(high > medium && medium > low)) {
    throw new Error(
      `Expected high > medium > low, got high=${high}, medium=${medium}, low=${low}`,
    );
  }
});

Deno.test("computeProviderQualityAdjustmentV2 penalizes very low-quality records", () => {
  const weak = {
    ...baseSummary,
    rawgRating: 1.0,
    rawgRatingsCount: 5,
    rawgMetacritic: 10,
    rawgAdded: 5,
  };

  const adjustment = computeProviderQualityAdjustmentV2(weak, "specific", "high");
  if (!(adjustment < 0)) {
    throw new Error(`Expected negative adjustment for very low quality, got ${adjustment}`);
  }
});
