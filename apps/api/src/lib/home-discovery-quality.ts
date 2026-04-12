import { normalizeSearchKey } from "./search/normalize";

export const UPCOMING_MIN_ADDED = 10;
export const UPCOMING_MIN_SUGGESTIONS = 40;
export const UPCOMING_MIN_RATINGS = 3;

export const LATEST_MIN_ADDED = 12;
export const LATEST_MIN_REVIEWS = 3;
export const LATEST_MIN_SUGGESTIONS = 40;
export const LATEST_MIN_RATINGS = 2;

export const POPULAR_MIN_ADDED = 25;
export const POPULAR_MIN_SUGGESTIONS = 50;
export const POPULAR_MIN_RATINGS = 5;

export function getHomeDiscoveryDedupeKey(name: string) {
  return normalizeSearchKey(name)
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
