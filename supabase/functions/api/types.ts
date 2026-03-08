import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../_shared/database.types.ts";

export type AdminClient = SupabaseClient<Database>;
export type TitleInsertRow = Database["public"]["Tables"]["titles"]["Insert"];
export type DbJson = Database["public"]["Tables"]["titles"]["Row"]["platforms"];
export type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];

export interface TitlePlatform {
  id: string;
  name: string;
}

export type ReleaseDatePrecision = "day" | "month" | "year" | "unknown";

export interface PlatformRelease {
  platformId: string;
  platformName: string;
  releaseDate: string | null;
  releaseDatePrecision: ReleaseDatePrecision;
}

export interface TitleSummary {
  id: string;
  kind: "game";
  source: "rawg";
  externalId: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  earliestReleaseDate: string | null;
  platforms: TitlePlatform[];
}

export interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
}

export interface TitleDetails extends TitleSummary {
  description: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  websiteUrl: string | null;
  releases: PlatformRelease[];
}

export interface LocalSearchResult {
  summary: TitleSummary;
  searchUpdatedAt: string;
}

export interface RawgSearchResponse {
  results?: RawgSearchGame[];
}

export interface RawgSearchGame {
  id: number;
  slug: string | null;
  name: string;
  background_image: string | null;
  released: string | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
  }>;
}

export interface RawgDetailGame extends RawgSearchGame {
  description_raw?: string | null;
  genres?: Array<{ name?: string }>;
  developers?: Array<{ name?: string }>;
  publishers?: Array<{ name?: string }>;
  website?: string | null;
  platforms?: Array<{
    platform?: {
      id?: number;
      name?: string;
    };
    released_at?: string | null;
  }>;
}

export interface ApiErrorPayload {
  error: string;
}
