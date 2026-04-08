import { Type } from "@sinclair/typebox";

import { TitleSummarySchema } from "./titles";

export const HomeDiscoveryResultSchema = Type.Object({
  upcoming: Type.Array(TitleSummarySchema),
  latest: Type.Array(TitleSummarySchema),
  popular: Type.Array(TitleSummarySchema),
});
