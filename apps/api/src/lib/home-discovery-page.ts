import type { TitleSummary } from "@repo/types";

export type HomeDiscoverySection = "upcoming" | "latest" | "popular";

type UpcomingOrLatestCursor = {
  section: "upcoming" | "latest";
  date: string;
  added: number;
  id: string;
};

type PopularCursor = {
  section: "popular";
  added: number;
  ratingsCount: number;
  suggestionsCount: number;
  id: string;
};

export type HomeDiscoveryCursor = UpcomingOrLatestCursor | PopularCursor;
export type HomeDiscoveryCursorBySection = {
  upcoming: UpcomingOrLatestCursor;
  latest: UpcomingOrLatestCursor;
  popular: PopularCursor;
};

export interface HomeDiscoveryPageResult {
  items: TitleSummary[];
  nextCursor: string | null;
}

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

export function normalizeHomeDiscoveryPageLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || !limit) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}

export function buildHomeDiscoveryPageResult(params: {
  section: HomeDiscoverySection;
  rows: TitleSummary[];
  limit: number;
}): HomeDiscoveryPageResult {
  const items = params.rows.slice(0, params.limit);
  const hasMore = params.rows.length > params.limit;
  const nextCursor =
    hasMore && items.length > 0
      ? encodeHomeDiscoveryCursor(
          buildCursorPayload(params.section, items[items.length - 1]!),
        )
      : null;

  return { items, nextCursor };
}

export function decodeHomeDiscoveryCursor<TSection extends HomeDiscoverySection>(
  cursor: string,
  section: TSection,
): HomeDiscoveryCursorBySection[TSection] | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Record<string, unknown>;

    if (!parsed || parsed.section !== section || typeof parsed.id !== "string") {
      return null;
    }

    if (section === "popular") {
      if (
        typeof parsed.added !== "number" ||
        typeof parsed.ratingsCount !== "number" ||
        typeof parsed.suggestionsCount !== "number"
      ) {
        return null;
      }

      return {
        section,
        added: parsed.added,
        ratingsCount: parsed.ratingsCount,
        suggestionsCount: parsed.suggestionsCount,
        id: parsed.id,
      } as HomeDiscoveryCursorBySection[TSection];
    }

    if (typeof parsed.date !== "string" || typeof parsed.added !== "number") {
      return null;
    }

    return {
      section,
      date: parsed.date,
      added: parsed.added,
      id: parsed.id,
    } as HomeDiscoveryCursorBySection[TSection];
  } catch {
    return null;
  }
}

function buildCursorPayload(
  section: HomeDiscoverySection,
  row: TitleSummary,
): HomeDiscoveryCursor {
  if (section === "popular") {
    return {
      section,
      added: row.rawgAdded ?? 0,
      ratingsCount: row.rawgRatingsCount ?? 0,
      suggestionsCount: row.rawgSuggestionsCount ?? 0,
      id: row.id,
    };
  }

  return {
    section,
    date: row.earliestReleaseDate ?? "",
    added: row.rawgAdded ?? 0,
    id: row.id,
  };
}

function encodeHomeDiscoveryCursor(cursor: HomeDiscoveryCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}
