import { z } from "zod";
import type {
  ContentKind,
  EntityId,
  ExternalId,
  IsoDateString,
  SourceProvider,
} from "./core";

export interface TitlePlatform {
  id: EntityId;
  name: string;
}

export type ReleaseDatePrecision = "day" | "month" | "year" | "unknown";

export interface PlatformRelease {
  platformId: EntityId;
  platformName: string;
  releaseDate: IsoDateString | null;
  releaseDatePrecision: ReleaseDatePrecision;
}

export interface TitleSummary {
  id: EntityId;
  kind: ContentKind;
  source: SourceProvider;
  externalId: ExternalId;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  earliestReleaseDate: IsoDateString | null;
  platforms: TitlePlatform[];
}

export interface TitleSearchResult {
  query: string;
  results: TitleSummary[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const titleSearchQuerySchema = z.object({
  query: z.string().trim().min(2, "Enter at least 2 characters."),
});

export type TitleSearchQueryInput = z.infer<typeof titleSearchQuerySchema>;

export interface TitleDetails extends TitleSummary {
  description: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  websiteUrl: string | null;
  releases: PlatformRelease[];
}
