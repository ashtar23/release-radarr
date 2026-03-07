import type { EntityId, IsoDateTimeString } from "./core.js";
import type { PlatformRelease, TitleSummary } from "./titles.js";

export interface WatchlistItem {
  id: EntityId;
  title: TitleSummary;
  releases: PlatformRelease[];
  addedAt: IsoDateTimeString;
}
