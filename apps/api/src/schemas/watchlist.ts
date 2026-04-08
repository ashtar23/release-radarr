import { Type } from "@sinclair/typebox";
import { watchlistSortValues } from "@repo/types";

import { PlatformReleaseSchema, TitleSummarySchema } from "./titles";

export const WatchlistSortSchema = Type.Union(
  watchlistSortValues.map((value) => Type.Literal(value)),
);

export const WatchlistItemSchema = Type.Object({
  id: Type.String(),
  title: TitleSummarySchema,
  releases: Type.Array(PlatformReleaseSchema),
  addedAt: Type.String(),
});

export const WatchlistListResultSchema = Type.Object({
  items: Type.Array(WatchlistItemSchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
});

export const WatchlistMembershipResultSchema = Type.Object({
  isInWatchlist: Type.Boolean(),
});

export const WatchlistUpsertResultSchema = Type.Object({
  item: WatchlistItemSchema,
});

export const WatchlistRemovedResultSchema = Type.Object({
  removed: Type.Literal(true),
});

export const WatchlistQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
  query: Type.Optional(Type.String()),
  sort: Type.Optional(WatchlistSortSchema),
});

export const WatchlistParamsSchema = Type.Object({
  titleId: Type.String({ minLength: 1 }),
});

export const WatchlistMutationBodySchema = Type.Object({
  titleId: Type.String({ minLength: 1 }),
});
