import { Type } from "@sinclair/typebox";

import { TitleSummarySchema } from "./titles";

export const HomeDiscoveryResultSchema = Type.Object({
  upcoming: Type.Array(TitleSummarySchema),
  latest: Type.Array(TitleSummarySchema),
  popular: Type.Array(TitleSummarySchema),
});

export const HomeDiscoveryPageQuerySchema = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.String()),
});

export const HomeDiscoveryPageResultSchema = Type.Object({
  items: Type.Array(TitleSummarySchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
});
