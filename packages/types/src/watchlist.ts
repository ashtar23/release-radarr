import type { EntityId, IsoDateTimeString } from "./core";
import type { PlatformRelease, TitleSummary } from "./titles";

export interface WatchlistItem {
  id: EntityId;
  title: TitleSummary;
  releases: PlatformRelease[];
  addedAt: IsoDateTimeString;
}
