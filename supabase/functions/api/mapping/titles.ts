import type {
  CachedTitleRow,
  PlatformRelease,
  RawgDetailGame,
  RawgSearchGame,
  TitleDetails,
  TitleInsertRow,
  TitlePlatform,
  TitleSummary,
} from "../types.ts";
import {
  assertTitleKind,
  assertTitleSource,
  normalizeIsoDate,
  toDbJson,
  toReleasePrecision,
} from "../utils/values.ts";

export function mapCachedRowToTitleSummary(row: CachedTitleRow): TitleSummary {
  assertTitleKind(row.kind);
  assertTitleSource(row.source);

  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    externalId: row.external_id,
    slug: row.slug,
    name: row.name,
    coverImageUrl: row.cover_image_url,
    earliestReleaseDate: row.earliest_release_date,
    platforms: parsePlatforms(row.platforms),
  };
}

export function mapCachedRowToTitleDetails(row: CachedTitleRow): TitleDetails {
  const summary = mapCachedRowToTitleSummary(row);
  return {
    ...summary,
    description: row.description,
    genres: row.genres ?? [],
    developers: row.developers ?? [],
    publishers: row.publishers ?? [],
    websiteUrl: row.website_url,
    releases: parseReleases(row.releases),
  };
}

export function mapSummaryToSearchUpsertRow(
  summary: TitleSummary,
  now: string,
): TitleInsertRow {
  return {
    id: summary.id,
    kind: summary.kind,
    source: summary.source,
    external_id: summary.externalId,
    slug: summary.slug,
    name: summary.name,
    cover_image_url: summary.coverImageUrl,
    earliest_release_date: summary.earliestReleaseDate,
    platforms: toDbJson(summary.platforms),
    search_updated_at: now,
    updated_at: now,
  };
}

export function mapDetailToUpsertRow(
  detail: TitleDetails,
  now: string,
): TitleInsertRow {
  return {
    id: detail.id,
    kind: detail.kind,
    source: detail.source,
    external_id: detail.externalId,
    slug: detail.slug,
    name: detail.name,
    cover_image_url: detail.coverImageUrl,
    earliest_release_date: detail.earliestReleaseDate,
    platforms: toDbJson(detail.platforms),
    description: detail.description,
    genres: detail.genres,
    developers: detail.developers,
    publishers: detail.publishers,
    website_url: detail.websiteUrl,
    releases: toDbJson(detail.releases),
    search_updated_at: now,
    detail_updated_at: now,
    updated_at: now,
  };
}

export function mapRawgSearchGameToSummary(game: RawgSearchGame): TitleSummary {
  const externalId = String(game.id);
  const slug = game.slug ?? game.name.toLowerCase().replace(/\s+/g, "-");

  return {
    id: `rawg:${externalId}`,
    kind: "game",
    source: "rawg",
    externalId,
    slug,
    name: game.name,
    coverImageUrl: game.background_image,
    earliestReleaseDate: normalizeIsoDate(game.released),
    platforms: normalizeRawgPlatforms(game.platforms),
  };
}

export function normalizeRawgReleases(
  rawgPlatforms: RawgDetailGame["platforms"],
): PlatformRelease[] {
  if (!rawgPlatforms?.length) {
    return [];
  }

  const deduped = new Map<string, PlatformRelease>();
  for (const item of rawgPlatforms) {
    const platformId = item.platform?.id;
    const platformName = item.platform?.name;
    if (!platformId || !platformName) continue;

    const id = `rawg-platform:${platformId}`;
    const releaseDate = normalizeIsoDate(item.released_at ?? null);
    deduped.set(id, {
      platformId: id,
      platformName,
      releaseDate,
      releaseDatePrecision: releaseDate ? "day" : "unknown",
    });
  }

  return Array.from(deduped.values());
}

export function mapNamedList(
  list: Array<{ name?: string }> | undefined,
): string[] {
  if (!list?.length) return [];
  return list
    .map((item) => item.name)
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
}

function parsePlatforms(value: unknown): TitlePlatform[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      return [];
    }

    return [{ id: record.id, name: record.name }];
  });
}

function parseReleases(value: unknown): PlatformRelease[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    if (
      typeof record.platformId !== "string" ||
      typeof record.platformName !== "string"
    ) {
      return [];
    }

    const releaseDate =
      typeof record.releaseDate === "string" ? record.releaseDate : null;
    const releaseDatePrecision = toReleasePrecision(
      record.releaseDatePrecision,
    );

    return [
      {
        platformId: record.platformId,
        platformName: record.platformName,
        releaseDate,
        releaseDatePrecision,
      },
    ];
  });
}

function normalizeRawgPlatforms(
  rawgPlatforms: RawgSearchGame["platforms"],
): TitlePlatform[] {
  if (!rawgPlatforms?.length) {
    return [];
  }

  const deduped = new Map<string, TitlePlatform>();
  for (const item of rawgPlatforms) {
    const platformId = item.platform?.id;
    const platformName = item.platform?.name;
    if (!platformId || !platformName) continue;

    const id = `rawg-platform:${platformId}`;
    deduped.set(id, { id, name: platformName });
  }

  return Array.from(deduped.values());
}
