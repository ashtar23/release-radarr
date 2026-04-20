import type { CatalogSliceConfig } from "./types";

export const CATALOG_SYNC_PAGE_SIZE = 40;
export const CATALOG_SYNC_DEFAULT_LIST_BUDGET_PER_RUN = 36;
export const CATALOG_SYNC_DEFAULT_DAILY_LIST_BUDGET = 400;
export const CATALOG_SYNC_DEFAULT_DAILY_DETAIL_BUDGET = 16;
export const CATALOG_SYNC_DEFAULT_DETAIL_LIMIT_PER_RUN = 4;

const PLATFORM_IDS = {
  pc: 4,
  ps5: 187,
  xboxSeries: 186,
  switch: 7,
} as const;

const GENRE_IDS = {
  action: 4,
  rpg: 5,
  shooter: 2,
  indie: 51,
} as const;

export const CATALOG_SYNC_SLICE_CONFIGS: CatalogSliceConfig[] = [
  createPlatformSlice("upcoming", "pc", PLATFORM_IDS.pc, 140, {
    ordering: "-added",
    dateWindow: { startOffsetDays: 0, endOffsetDays: 365 },
  }),
  createPlatformSlice("upcoming", "ps5", PLATFORM_IDS.ps5, 138, {
    ordering: "-added",
    dateWindow: { startOffsetDays: 0, endOffsetDays: 365 },
  }),
  createPlatformSlice("upcoming", "xbox-series", PLATFORM_IDS.xboxSeries, 136, {
    ordering: "-added",
    dateWindow: { startOffsetDays: 0, endOffsetDays: 365 },
  }),
  createPlatformSlice("upcoming", "switch", PLATFORM_IDS.switch, 134, {
    ordering: "-added",
    dateWindow: { startOffsetDays: 0, endOffsetDays: 365 },
  }),
  createPlatformSlice("recent", "pc", PLATFORM_IDS.pc, 128, {
    ordering: "-released",
    dateWindow: { startOffsetDays: -90, endOffsetDays: 0 },
  }),
  createPlatformSlice("recent", "ps5", PLATFORM_IDS.ps5, 126, {
    ordering: "-released",
    dateWindow: { startOffsetDays: -90, endOffsetDays: 0 },
  }),
  createPlatformSlice("recent", "xbox-series", PLATFORM_IDS.xboxSeries, 124, {
    ordering: "-released",
    dateWindow: { startOffsetDays: -90, endOffsetDays: 0 },
  }),
  createPlatformSlice("recent", "switch", PLATFORM_IDS.switch, 122, {
    ordering: "-released",
    dateWindow: { startOffsetDays: -90, endOffsetDays: 0 },
  }),
  createPlatformSlice("popular", "pc", PLATFORM_IDS.pc, 118, {
    ordering: "-added",
    dateWindow: { startOffsetDays: -365, endOffsetDays: 180 },
  }),
  createPlatformSlice("popular", "ps5", PLATFORM_IDS.ps5, 116, {
    ordering: "-added",
    dateWindow: { startOffsetDays: -365, endOffsetDays: 180 },
  }),
  createPlatformSlice("popular", "xbox-series", PLATFORM_IDS.xboxSeries, 114, {
    ordering: "-added",
    dateWindow: { startOffsetDays: -365, endOffsetDays: 180 },
  }),
  createPlatformSlice("popular", "switch", PLATFORM_IDS.switch, 112, {
    ordering: "-added",
    dateWindow: { startOffsetDays: -365, endOffsetDays: 180 },
  }),
  createGenreSlice("action", GENRE_IDS.action, 108),
  createGenreSlice("rpg", GENRE_IDS.rpg, 106),
  createGenreSlice("shooter", GENRE_IDS.shooter, 104),
  createGenreSlice("indie", GENRE_IDS.indie, 102),
];

function createPlatformSlice(
  familyKey: "upcoming" | "recent" | "popular",
  platformKey: string,
  platformId: number,
  priority: number,
  params: CatalogSliceConfig["params"],
): CatalogSliceConfig {
  return {
    key: `${familyKey}:${platformKey}`,
    family:
      familyKey === "upcoming"
        ? "upcoming_by_platform"
        : familyKey === "recent"
          ? "recent_by_platform"
          : "popular_by_platform",
    enabled: true,
    priority,
    cadenceHours: 4,
    pageBudgetPerRun: familyKey === "upcoming" ? 3 : 2,
    params: {
      ...params,
      platforms: [platformId],
    },
  };
}

function createGenreSlice(
  genreKey: string,
  genreId: number,
  priority: number,
): CatalogSliceConfig {
  return {
    key: `popular:genre:${genreKey}`,
    family: "popular_by_genre",
    enabled: true,
    priority,
    cadenceHours: 8,
    pageBudgetPerRun: 2,
    params: {
      ordering: "-added",
      dateWindow: { startOffsetDays: -365, endOffsetDays: 180 },
      genres: [genreId],
    },
  };
}
