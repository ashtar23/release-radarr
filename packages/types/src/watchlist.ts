import type { EntityId, IsoDateTimeString } from "./core";
import type { PlatformRelease, TitleSummary } from "./titles";

export interface WatchlistItem {
  id: EntityId;
  title: TitleSummary;
  releases: PlatformRelease[];
  addedAt: IsoDateTimeString;
}

export interface WatchlistListResult {
  items: WatchlistItem[];
}

export interface WatchlistUpsertResult {
  item: WatchlistItem;
}

export interface AddWatchlistItemInput {
  titleId: EntityId;
}

export interface RemoveWatchlistItemInput {
  titleId: EntityId;
}
