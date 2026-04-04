import type { EntityId, IsoDateTimeString } from "./core";
import type { PlatformRelease, TitleSummary } from "./titles";

export const watchlistSortValues = [
  "added-desc",
  "added-asc",
  "release-desc",
  "release-asc",
  "name-asc",
  "name-desc",
] as const;

export type WatchlistSort = (typeof watchlistSortValues)[number];

export interface WatchlistItem {
  id: EntityId;
  title: TitleSummary;
  releases: PlatformRelease[];
  addedAt: IsoDateTimeString;
}

export interface ListWatchlistInput {
  cursor?: string;
  limit?: number;
  sort?: WatchlistSort;
}

export interface WatchlistListResult {
  items: WatchlistItem[];
  nextCursor: string | null;
}

export interface WatchlistUpsertResult {
  item: WatchlistItem;
}

export interface WatchlistMembershipResult {
  isInWatchlist: boolean;
}

export interface AddWatchlistItemInput {
  titleId: EntityId;
}

export interface RemoveWatchlistItemInput {
  titleId: EntityId;
}
