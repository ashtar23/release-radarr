import type { TitleSummary } from "@repo/types";

export type SearchRow = {
  id: string;
  kind: "game";
  source: "rawg";
  external_id: string;
  slug: string;
  name: string;
  cover_image_url: string | null;
  earliest_release_date: string | Date | null;
  developers: unknown;
  publishers: unknown;
  platforms: unknown;
  rawg_rating: number | null;
  rawg_ratings_count: number | null;
  rawg_metacritic: number | null;
  rawg_added: number | null;
  rawg_reviews_count: number | null;
  rawg_suggestions_count: number | null;
  rawg_rating_top: number | null;
};

export type CountRow = {
  total_count: number;
};

export interface SearchTitlesParams {
  query: string;
  page: number;
  limit: number;
  forceRefresh: boolean;
}

export interface RankedSearchCandidate {
  summary: TitleSummary;
  developers: string[];
  publishers: string[];
}

export interface ProviderSearchResult {
  totalCount: number | null;
  results: RankedSearchCandidate[];
}

export type SearchIntentMode = "broad" | "specific";

export interface SearchContext {
  normalizedQuery: string;
  queryTokens: string[];
  queryTokenSet: Set<string>;
  intentMode: SearchIntentMode;
  includesEditionTerms: boolean;
}

export interface SearchScore {
  total: number;
  qualityScore: number;
}
