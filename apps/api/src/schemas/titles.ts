import { Type } from "@sinclair/typebox";
import {
  searchDecisionReasonValues,
  searchProviderUsedTriggerValues,
  searchServedByValues,
} from "@repo/types";

const SearchServedBySchema = Type.Union(
  searchServedByValues.map((value) => Type.Literal(value)),
);

const SearchDecisionReasonSchema = Type.Union(
  searchDecisionReasonValues.map((value) => Type.Literal(value)),
);

const SearchProviderUsedTriggerSchema = Type.Union(
  searchProviderUsedTriggerValues.map((value) => Type.Literal(value)),
);

const ReleaseDatePrecisionSchema = Type.Union([
  Type.Literal("day"),
  Type.Literal("month"),
  Type.Literal("year"),
  Type.Literal("unknown"),
]);

export const TitlePlatformSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export const PlatformReleaseSchema = Type.Object({
  platformId: Type.String(),
  platformName: Type.String(),
  releaseDate: Type.Union([Type.String(), Type.Null()]),
  releaseDatePrecision: ReleaseDatePrecisionSchema,
});

export const TitleSummarySchema = Type.Object({
  id: Type.String(),
  kind: Type.Literal("game"),
  source: Type.Literal("rawg"),
  externalId: Type.String(),
  slug: Type.String(),
  name: Type.String(),
  coverImageUrl: Type.Union([Type.String(), Type.Null()]),
  earliestReleaseDate: Type.Union([Type.String(), Type.Null()]),
  platforms: Type.Array(TitlePlatformSchema),
  rawgRating: Type.Union([Type.Number(), Type.Null()]),
  rawgRatingsCount: Type.Union([Type.Number(), Type.Null()]),
  rawgMetacritic: Type.Union([Type.Number(), Type.Null()]),
  rawgAdded: Type.Union([Type.Number(), Type.Null()]),
  rawgReviewsCount: Type.Union([Type.Number(), Type.Null()]),
  rawgSuggestionsCount: Type.Union([Type.Number(), Type.Null()]),
  rawgRatingTop: Type.Union([Type.Number(), Type.Null()]),
});

export const TitleSearchResultSchema = Type.Object({
  query: Type.String(),
  results: Type.Array(TitleSummarySchema),
  totalCount: Type.Number(),
  page: Type.Number(),
  limit: Type.Number(),
  hasMore: Type.Boolean(),
  servedBy: Type.Optional(SearchServedBySchema),
  decisionReason: Type.Optional(SearchDecisionReasonSchema),
  providerUsedTrigger: Type.Optional(SearchProviderUsedTriggerSchema),
});

export const TitleDetailsSchema = Type.Composite([
  TitleSummarySchema,
  Type.Object({
    description: Type.Union([Type.String(), Type.Null()]),
    genres: Type.Array(Type.String()),
    developers: Type.Array(Type.String()),
    publishers: Type.Array(Type.String()),
    websiteUrl: Type.Union([Type.String(), Type.Null()]),
    releases: Type.Array(PlatformReleaseSchema),
  }),
]);

export const TitleDetailsResultSchema = Type.Object({
  details: TitleDetailsSchema,
  isInWatchlist: Type.Boolean(),
});

export const SearchTitlesQuerySchema = Type.Object({
  query: Type.String({
    minLength: 2,
    description: "Search query text.",
  }),
  page: Type.Optional(
    Type.String({
      description: "Optional positive integer page number.",
    }),
  ),
  limit: Type.Optional(
    Type.String({
      description: "Optional positive integer page size.",
    }),
  ),
  forceRefresh: Type.Optional(
    Type.String({
      description: "Optional truthy flag: 1, true, or yes.",
    }),
  ),
});

export const TitleParamsSchema = Type.Object({
  titleId: Type.String({ minLength: 1 }),
});
