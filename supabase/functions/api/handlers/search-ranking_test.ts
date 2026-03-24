import type { LocalSearchResult, TitleSummary } from "../types.ts";
import {
  getBroadSparseFreshLocalSufficientForTesting,
  getLocalPolicyPageCountForTesting,
  getProviderDecisionReasonForTesting,
  getProviderPageBudgetForTesting,
  getProviderSearchQueryForTesting,
  getRelevantLocalStaleRatioForTesting,
  getSearchQueryVariantsForTesting,
  inferQuerySearchOptionsForTesting,
  mergeResultsForTesting,
  rankResultsForTesting,
} from "./search.ts";
import { evaluateSearchFallbackPolicy } from "../utils/search-fallback-policy.ts";

function createTitleSummary(
  id: string,
  name: string,
  overrides: Partial<TitleSummary> = {},
): TitleSummary {
  return {
    id,
    kind: "game",
    source: "rawg",
    externalId: id.replace("rawg:", ""),
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    coverImageUrl: "https://example.com/cover.png",
    earliestReleaseDate: "2023-01-01",
    platforms: [{ id: "rawg-platform:1", name: "PC" }],
    rawgRating: 4,
    rawgRatingsCount: 400,
    rawgMetacritic: 80,
    rawgAdded: 2000,
    rawgReviewsCount: 300,
    rawgSuggestionsCount: 120,
    rawgRatingTop: 5,
    ...overrides,
  };
}

function createLocalSearchResult(
  id: string,
  name: string,
  searchUpdatedAt: string,
  overrides: Partial<TitleSummary> = {},
): LocalSearchResult {
  return {
    summary: createTitleSummary(id, name, overrides),
    searchUpdatedAt,
  };
}

Deno.test("Ranking V2: canonical title outranks noisy variant for specific query", () => {
  const query = "prince of persia";
  const canonical = createTitleSummary(
    "rawg:canonical",
    "Prince of Persia (1989)",
    {
      rawgRating: 4.4,
      rawgRatingsCount: 1800,
      rawgMetacritic: 83,
      rawgAdded: 7033,
      rawgReviewsCount: 1858,
      rawgSuggestionsCount: 502,
    },
  );
  const noisy = createTitleSummary(
    "rawg:noisy",
    "Prince of Persia Demo",
    {
      rawgRating: 2.1,
      rawgRatingsCount: 9,
      rawgMetacritic: 24,
      rawgAdded: 80,
      rawgReviewsCount: 12,
      rawgSuggestionsCount: 5,
    },
  );

  const ranked = rankResultsForTesting(
    [noisy, canonical],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical result first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: quality signal breaks ties between similarly relevant titles", () => {
  const query = "god of war ragnarok";
  const highQuality = createTitleSummary("rawg:high", "God of War Ragnarök", {
    rawgRating: 4.6,
    rawgRatingsCount: 4300,
    rawgMetacritic: 94,
    rawgAdded: 12000,
    rawgReviewsCount: 2200,
    rawgSuggestionsCount: 680,
  });
  const lowerQuality = createTitleSummary(
    "rawg:low",
    "God of War Ragnarok",
    {
      rawgRating: 3.2,
      rawgRatingsCount: 120,
      rawgMetacritic: 62,
      rawgAdded: 700,
      rawgReviewsCount: 80,
      rawgSuggestionsCount: 25,
    },
  );

  const ranked = rankResultsForTesting(
    [lowerQuality, highQuality],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== highQuality.id) {
    throw new Error(`Expected higher quality variant first, got ${ranked[0]?.id}`);
  }
});

Deno.test("Ranking V2: low lexical match cannot be rescued by popularity", () => {
  const query = "bloodborne";
  const lexicalMatch = createTitleSummary("rawg:bloodborne", "Bloodborne", {
    rawgRating: 4.2,
    rawgRatingsCount: 1800,
    rawgMetacritic: 92,
    rawgAdded: 14000,
  });
  const popularButIrrelevant = createTitleSummary(
    "rawg:irrelevant",
    "Action RPG Chronicles",
    {
      rawgRating: 4.9,
      rawgRatingsCount: 12000,
      rawgMetacritic: 98,
      rawgAdded: 45000,
      rawgReviewsCount: 8400,
      rawgSuggestionsCount: 3000,
    },
  );

  const ranked = rankResultsForTesting(
    [popularButIrrelevant, lexicalMatch],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== lexicalMatch.id) {
    throw new Error(
      `Expected lexical match first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad single-token query favors canonical Witcher title", () => {
  const query = "witcher";
  const canonical = createTitleSummary(
    "rawg:canon",
    "The Witcher 3: Wild Hunt",
    {
      rawgRating: 4.7,
      rawgRatingsCount: 9000,
      rawgMetacritic: 93,
      rawgAdded: 22000,
      rawgReviewsCount: 4200,
      rawgSuggestionsCount: 900,
      rawgRatingTop: 5,
    },
  );
  const noisy = createTitleSummary("rawg:noisy2", "Witcher's dungeon", {
    rawgRating: 2.2,
    rawgRatingsCount: 18,
    rawgMetacritic: 40,
    rawgAdded: 90,
    rawgReviewsCount: 11,
    rawgSuggestionsCount: 4,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:web", name: "Web" }],
  });

  const ranked = rankResultsForTesting([noisy, canonical], query, "broad", true);
  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical broad match first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad query promotes canonical title over low-signal exact match", () => {
  const query = "crimson";
  const canonical = createTitleSummary("rawg:crimson-desert", "Crimson Desert", {
    rawgRating: 4.4,
    rawgRatingsCount: 4200,
    rawgMetacritic: 84,
    rawgAdded: 12000,
    rawgReviewsCount: 2500,
    rawgSuggestionsCount: 700,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const lowSignalExact = createTitleSummary("rawg:crimson-exact", "Crimson", {
    rawgRating: 2.3,
    rawgRatingsCount: 14,
    rawgMetacritic: 44,
    rawgAdded: 120,
    rawgReviewsCount: 10,
    rawgSuggestionsCount: 3,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:web", name: "Web" }],
  });

  const ranked = rankResultsForTesting(
    [lowSignalExact, canonical],
    query,
    "broad",
    true,
  );
  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical broad result first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: specific franchise query demotes itch/android noise", () => {
  const query = "god of war";
  const canonical = createTitleSummary("rawg:gow-2018", "God of War", {
    rawgRating: 4.6,
    rawgRatingsCount: 9000,
    rawgMetacritic: 94,
    rawgAdded: 24000,
    rawgReviewsCount: 4500,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps", name: "PlayStation 4" }],
  });
  const itchNoise = createTitleSummary("rawg:gow-itch", "GOD OF WAR (itch)", {
    rawgRating: 2.4,
    rawgRatingsCount: 12,
    rawgMetacritic: 35,
    rawgAdded: 90,
    rawgReviewsCount: 7,
    rawgSuggestionsCount: 2,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const androidNoise = createTitleSummary(
    "rawg:gow-android",
    "God of war 4 (android)",
    {
      rawgRating: 2.1,
      rawgRatingsCount: 20,
      rawgMetacritic: 38,
      rawgAdded: 120,
      rawgReviewsCount: 11,
      rawgSuggestionsCount: 3,
      rawgRatingTop: 2,
      platforms: [{ id: "rawg-platform:pc", name: "PC" }],
    },
  );

  const ranked = rankResultsForTesting(
    [itchNoise, androidNoise, canonical],
    query,
    "specific",
    true,
  );
  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical result first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Freshness window ignores stale tail when top-ranked local page is fresh", () => {
  const now = new Date().toISOString();
  const stale = "2020-01-01T00:00:00.000Z";
  const query = "city skylines";
  const localResults: LocalSearchResult[] = [
    ...Array.from({ length: 20 }, (_, index) =>
      createLocalSearchResult(
        `rawg:city-skylines-${index}`,
        index === 0 ? "Cities: Skylines" : `Cities: Skylines pack ${index}`,
        now,
        {
          rawgRating: 4.4,
          rawgRatingsCount: 4000 - index * 20,
          rawgMetacritic: 85 - (index % 5),
          rawgAdded: 12000 - index * 40,
          rawgReviewsCount: 2500 - index * 10,
          rawgSuggestionsCount: 600 - index * 3,
          platforms: [{ id: "rawg-platform:pc", name: "PC" }],
        },
      )
    ),
    ...Array.from({ length: 60 }, (_, index) =>
      createLocalSearchResult(
        `rawg:noise-${index}`,
        `City builder archive ${index}`,
        stale,
        {
          rawgRating: 2.1,
          rawgRatingsCount: 4,
          rawgMetacritic: 30,
          rawgAdded: 20,
          rawgReviewsCount: 2,
          rawgSuggestionsCount: 1,
          platforms: [{ id: "rawg-platform:web", name: "Web" }],
        },
      )
    ),
  ];

  const staleRatio = getRelevantLocalStaleRatioForTesting(
    localResults,
    query,
    "specific",
    1,
    20,
  );

  if (staleRatio > 0.3) {
    throw new Error(`Expected visible-window stale ratio <= 0.3, got ${staleRatio}`);
  }
});

Deno.test("Broad freshness window follows denoised visible franchise page", () => {
  const now = new Date().toISOString();
  const stale = "2020-01-01T00:00:00.000Z";
  const query = "wolverine";
  const localResults: LocalSearchResult[] = [
    createLocalSearchResult("rawg:wolverine-revenge", "X2: Wolverine's Revenge", now, {
      rawgRating: 3.8,
      rawgRatingsCount: 620,
      rawgMetacritic: 70,
      rawgAdded: 3400,
      rawgReviewsCount: 210,
      rawgSuggestionsCount: 62,
      platforms: [{ id: "rawg-platform:ps2", name: "PlayStation 2" }],
    }),
    createLocalSearchResult("rawg:wolverine-origins", "X-Men Origins: Wolverine", now, {
      rawgRating: 4.1,
      rawgRatingsCount: 1800,
      rawgMetacritic: 75,
      rawgAdded: 9000,
      rawgReviewsCount: 700,
      rawgSuggestionsCount: 220,
      platforms: [{ id: "rawg-platform:xbox", name: "Xbox 360" }],
    }),
    createLocalSearchResult("rawg:marvel-wolverine", "Marvel's Wolverine", now, {
      earliestReleaseDate: "2027-06-30",
      rawgRating: 4.8,
      rawgRatingsCount: 3200,
      rawgMetacritic: 88,
      rawgAdded: 28000,
      rawgReviewsCount: 1400,
      rawgSuggestionsCount: 900,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    }),
    ...Array.from({ length: 60 }, (_, index) =>
      createLocalSearchResult(
        `rawg:wolverine-archive-${index}`,
        `Wolverine archive ${index}`,
        stale,
        {
          rawgRating: 2.0,
          rawgRatingsCount: 4,
          rawgMetacritic: 20,
          rawgAdded: 16,
          rawgReviewsCount: 1,
          rawgSuggestionsCount: 0,
          rawgRatingTop: 1,
          platforms: [{ id: "rawg-platform:pc", name: "PC" }],
        },
      )
    ),
  ];

  const staleRatio = getRelevantLocalStaleRatioForTesting(
    localResults,
    query,
    "broad",
    1,
    20,
  );

  if (staleRatio > 0.3) {
    throw new Error(
      `Expected broad visible-window stale ratio <= 0.3, got ${staleRatio}`,
    );
  }
});

Deno.test("Ranking V2: merged alias query matches canonical Spider-Man title", () => {
  const query = "spiderman";
  const canonical = createTitleSummary("rawg:spider-man", "Marvel's Spider-Man", {
    rawgRating: 4.7,
    rawgRatingsCount: 9500,
    rawgMetacritic: 87,
    rawgAdded: 22000,
    rawgReviewsCount: 5000,
    rawgSuggestionsCount: 1200,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const noisy = createTitleSummary("rawg:spiderman-alpha", "Spiderman: Free-Swing Alpha", {
    rawgRating: 2.2,
    rawgRatingsCount: 18,
    rawgMetacritic: 35,
    rawgAdded: 90,
    rawgReviewsCount: 7,
    rawgSuggestionsCount: 2,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting([noisy, canonical], query, "broad", true);
  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical Spider-Man first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad recency boost favors newer anchored franchise title", () => {
  const query = "crimson";
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const upcoming = createTitleSummary("rawg:crimson-desert", "Crimson Desert", {
    earliestReleaseDate: futureDate,
    rawgRating: 4.1,
    rawgRatingsCount: 1300,
    rawgMetacritic: 82,
    rawgAdded: 9200,
    rawgReviewsCount: 730,
    rawgSuggestionsCount: 240,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const older = createTitleSummary("rawg:crimson-echo", "Crimson Echo", {
    earliestReleaseDate: "2013-09-10",
    rawgRating: 4.2,
    rawgRatingsCount: 1400,
    rawgMetacritic: 84,
    rawgAdded: 9800,
    rawgReviewsCount: 760,
    rawgSuggestionsCount: 250,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting([older, upcoming], query, "broad", true);
  if (ranked[0]?.id !== upcoming.id) {
    throw new Error(
      `Expected newer anchored Crimson title first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad recency boost does not promote low-signal future noise", () => {
  const query = "crimson";
  const futureDate = new Date(Date.now() + 240 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const established = createTitleSummary("rawg:crimson-echo-stable", "Crimson Echo", {
    earliestReleaseDate: "2018-11-20",
    rawgRating: 4.3,
    rawgRatingsCount: 2100,
    rawgMetacritic: 86,
    rawgAdded: 13000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 400,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const futureLowSignal = createTitleSummary("rawg:crimson-quest-noise", "Crimson Quest", {
    earliestReleaseDate: futureDate,
    rawgRating: 2.2,
    rawgRatingsCount: 8,
    rawgMetacritic: 40,
    rawgAdded: 18,
    rawgReviewsCount: 2,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:linux", name: "Linux" }],
  });

  const ranked = rankResultsForTesting(
    [futureLowSignal, established],
    query,
    "broad",
    true,
  );
  if (ranked[0]?.id !== established.id) {
    throw new Error(
      `Expected established higher-quality Crimson title first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: specific franchise query demotes derivative subtitle DLC entries", () => {
  const query = "marvel spider man";
  const sequel = createTitleSummary("rawg:spider-man-2", "Marvel's Spider-Man 2", {
    earliestReleaseDate: "2023-10-20",
    rawgRating: 4.7,
    rawgRatingsCount: 12000,
    rawgMetacritic: 90,
    rawgAdded: 34000,
    rawgReviewsCount: 5200,
    rawgSuggestionsCount: 1600,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const remastered = createTitleSummary(
    "rawg:spider-man-remastered",
    "Marvel's Spider-Man Remastered",
    {
      earliestReleaseDate: "2022-08-12",
      rawgRating: 4.6,
      rawgRatingsCount: 8500,
      rawgMetacritic: 87,
      rawgAdded: 25000,
      rawgReviewsCount: 3900,
      rawgSuggestionsCount: 1100,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const heist = createTitleSummary(
    "rawg:spider-man-heist",
    "Marvel's Spider-Man - The Heist",
    {
      earliestReleaseDate: "2018-10-23",
      rawgRating: 3.9,
      rawgRatingsCount: 600,
      rawgMetacritic: 75,
      rawgAdded: 3200,
      rawgReviewsCount: 190,
      rawgSuggestionsCount: 40,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );
  const silverLining = createTitleSummary(
    "rawg:spider-man-silver-lining",
    "Marvel's Spider-Man - Silver Lining",
    {
      earliestReleaseDate: "2018-12-21",
      rawgRating: 3.8,
      rawgRatingsCount: 550,
      rawgMetacritic: 73,
      rawgAdded: 3000,
      rawgReviewsCount: 170,
      rawgSuggestionsCount: 36,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );
  const miles = createTitleSummary(
    "rawg:spider-man-miles-core",
    "Marvel's Spider-Man Miles Morales",
    {
      earliestReleaseDate: "2020-11-12",
      rawgRating: 4.5,
      rawgRatingsCount: 9000,
      rawgMetacritic: 85,
      rawgAdded: 22000,
      rawgReviewsCount: 3300,
      rawgSuggestionsCount: 950,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const pcPort = createTitleSummary(
    "rawg:spider-man-2-pc-port",
    "Marvel's Spider-Man 2 PC Port",
    {
      earliestReleaseDate: "2025-01-30",
      rawgRating: 4.4,
      rawgRatingsCount: 7800,
      rawgMetacritic: 86,
      rawgAdded: 16000,
      rawgReviewsCount: 2400,
      rawgSuggestionsCount: 700,
      platforms: [{ id: "rawg-platform:pc", name: "PC" }],
    },
  );

  const ranked = rankResultsForTesting(
    [heist, silverLining, remastered, sequel, miles, pcPort],
    query,
    "specific",
    true,
  );
  const topTwo = ranked.slice(0, 2).map((result) => result.id);
  if (!topTwo.includes(sequel.id) || !topTwo.includes(remastered.id)) {
    throw new Error(`Expected core Spider-Man titles in top 2, got ${topTwo.join(", ")}`);
  }

  const sequelIndex = ranked.findIndex((result) => result.id === sequel.id);
  const heistIndex = ranked.findIndex((result) => result.id === heist.id);
  if (sequelIndex === -1 || heistIndex === -1 || sequelIndex > heistIndex) {
    throw new Error(
      `Expected numbered sequel to outrank derivative subtitle (indexes sequel=${sequelIndex}, heist=${heistIndex})`,
    );
  }

  const topFive = ranked.slice(0, 5).map((result) => result.id);
  const derivativeInTopFive = topFive.filter((id) =>
    id === heist.id || id === silverLining.id
  );
  if (derivativeInTopFive.length > 1) {
    throw new Error(
      `Expected at most one derivative subtitle result in top 5, got ${derivativeInTopFive.join(", ")}`,
    );
  }
});

Deno.test("Ranking V2: specific top-window cap applies to high-quality derivative subtitle entries", () => {
  const query = "marvel spider man";
  const base = createTitleSummary("rawg:spider-man-core", "Marvel's Spider-Man", {
    earliestReleaseDate: "2018-09-07",
    rawgRating: 4.7,
    rawgRatingsCount: 9500,
    rawgMetacritic: 87,
    rawgAdded: 22000,
    rawgReviewsCount: 5000,
    rawgSuggestionsCount: 1200,
    platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
  });
  const sequel = createTitleSummary("rawg:spider-man-2-core", "Marvel's Spider-Man 2", {
    earliestReleaseDate: "2023-10-20",
    rawgRating: 4.8,
    rawgRatingsCount: 12000,
    rawgMetacritic: 90,
    rawgAdded: 34000,
    rawgReviewsCount: 5200,
    rawgSuggestionsCount: 1600,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const remastered = createTitleSummary(
    "rawg:spider-man-remastered-core",
    "Marvel's Spider-Man Remastered",
    {
      earliestReleaseDate: "2022-08-12",
      rawgRating: 4.6,
      rawgRatingsCount: 8500,
      rawgMetacritic: 87,
      rawgAdded: 25000,
      rawgReviewsCount: 3900,
      rawgSuggestionsCount: 1100,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const heist = createTitleSummary(
    "rawg:spider-man-heist-hq",
    "Marvel's Spider-Man - The Heist",
    {
      earliestReleaseDate: "2018-10-23",
      rawgRating: 4.6,
      rawgRatingsCount: 4200,
      rawgMetacritic: 82,
      rawgAdded: 12500,
      rawgReviewsCount: 1600,
      rawgSuggestionsCount: 350,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );
  const silverLining = createTitleSummary(
    "rawg:spider-man-silver-lining-hq",
    "Marvel's Spider-Man - Silver Lining",
    {
      earliestReleaseDate: "2018-12-21",
      rawgRating: 4.5,
      rawgRatingsCount: 3900,
      rawgMetacritic: 80,
      rawgAdded: 11800,
      rawgReviewsCount: 1400,
      rawgSuggestionsCount: 320,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );
  const turfWars = createTitleSummary(
    "rawg:spider-man-turf-wars-hq",
    "Marvel's Spider-Man - Turf Wars",
    {
      earliestReleaseDate: "2018-11-20",
      rawgRating: 4.4,
      rawgRatingsCount: 3600,
      rawgMetacritic: 79,
      rawgAdded: 11200,
      rawgReviewsCount: 1300,
      rawgSuggestionsCount: 300,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );

  const ranked = rankResultsForTesting(
    [heist, silverLining, turfWars, remastered, sequel, base],
    query,
    "specific",
    true,
  );
  const topFive = ranked.slice(0, 5).map((result) => result.id);
  const derivativeInTopFive = topFive.filter((id) =>
    id === heist.id || id === silverLining.id || id === turfWars.id
  );

  if (derivativeInTopFive.length > 1) {
    throw new Error(
      `Expected at most one derivative subtitle result in top 5, got ${derivativeInTopFive.join(", ")}`,
    );
  }
});

Deno.test("Ranking V2: specific derivative intent keeps requested subtitle result high", () => {
  const query = "spider man heist";
  const base = createTitleSummary("rawg:spider-man-2018", "Marvel's Spider-Man", {
    earliestReleaseDate: "2018-09-07",
    rawgRating: 4.7,
    rawgRatingsCount: 9500,
    rawgMetacritic: 87,
    rawgAdded: 22000,
    rawgReviewsCount: 5000,
    rawgSuggestionsCount: 1200,
    platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
  });
  const heist = createTitleSummary(
    "rawg:spider-man-heist-intent",
    "Marvel's Spider-Man - The Heist",
    {
      earliestReleaseDate: "2018-10-23",
      rawgRating: 3.9,
      rawgRatingsCount: 600,
      rawgMetacritic: 75,
      rawgAdded: 3200,
      rawgReviewsCount: 190,
      rawgSuggestionsCount: 40,
      platforms: [{ id: "rawg-platform:ps4", name: "PlayStation 4" }],
    },
  );

  const ranked = rankResultsForTesting([base, heist], query, "specific", true);
  if (ranked[0]?.id !== heist.id) {
    throw new Error(`Expected requested heist subtitle first, got ${ranked[0]?.id ?? "none"}`);
  }
});

Deno.test("Ranking V2: parenthetical vendor suffix loses to canonical Wolverine title", () => {
  const query = "wolverine";
  const canonical = createTitleSummary("rawg:marvel-wolverine", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const vendorSuffix = createTitleSummary(
    "rawg:wolverine-soft",
    "Starship Slime (Wolverine Soft)",
    {
      rawgRating: 2.1,
      rawgRatingsCount: 6,
      rawgMetacritic: 20,
      rawgAdded: 15,
      rawgReviewsCount: 2,
      rawgSuggestionsCount: 1,
      rawgRatingTop: 1,
      platforms: [{ id: "rawg-platform:linux", name: "Linux" }],
    },
  );

  const ranked = rankResultsForTesting([vendorSuffix, canonical], query, "specific", true);
  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical Wolverine first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Search retrieval expands merged alias query variants", () => {
  const variants = getSearchQueryVariantsForTesting("Spiderman");

  if (!variants.includes("spider man")) {
    throw new Error("Expected normalized alias variant 'spider man'");
  }
});

Deno.test("Search retrieval prefers expanded provider query for merged alias", () => {
  const providerQuery = getProviderSearchQueryForTesting("Spiderman");

  if (providerQuery !== "spider man") {
    throw new Error(`Expected provider query 'spider man', got '${providerQuery}'`);
  }
});

Deno.test("Search retrieval expands alias phrases inside larger sequel queries", () => {
  const variants = getSearchQueryVariantsForTesting("Spiderman 2");
  const providerQuery = getProviderSearchQueryForTesting("Spiderman 2");

  if (!variants.includes("spider man 2")) {
    throw new Error("Expected normalized alias variant 'spider man 2'");
  }

  if (providerQuery !== "spider man 2") {
    throw new Error(`Expected provider query 'spider man 2', got '${providerQuery}'`);
  }
});

Deno.test("Sparse broad page-one queries use expanded provider budget", () => {
  const sparseBroadBudget = getProviderPageBudgetForTesting("broad", 1, 3, 24);
  const protectedSparseBudget = getProviderPageBudgetForTesting(
    "broad",
    1,
    3,
    24,
    true,
  );
  const healthyBroadBudget = getProviderPageBudgetForTesting("broad", 1, 8, 24);
  const specificBudget = getProviderPageBudgetForTesting("specific", 1, 3, 24);
  const secondPageBudget = getProviderPageBudgetForTesting("broad", 2, 3, 24);

  if (sparseBroadBudget !== 3) {
    throw new Error(`Expected sparse broad provider budget=3, got ${sparseBroadBudget}`);
  }

  if (healthyBroadBudget !== 1) {
    throw new Error(`Expected healthy broad provider budget=1, got ${healthyBroadBudget}`);
  }

  if (protectedSparseBudget !== 1) {
    throw new Error(
      `Expected protected sparse broad provider budget=1, got ${protectedSparseBudget}`,
    );
  }

  if (specificBudget !== 1) {
    throw new Error(`Expected specific provider budget=1, got ${specificBudget}`);
  }

  if (secondPageBudget !== 1) {
    throw new Error(`Expected non-first-page provider budget=1, got ${secondPageBudget}`);
  }
});

Deno.test("Provider decision reason reflects trigger path", () => {
  const forcedReason = getProviderDecisionReasonForTesting(true, false);
  const sparseReason = getProviderDecisionReasonForTesting(false, true);
  const genericReason = getProviderDecisionReasonForTesting(false, false);

  if (forcedReason !== "forced_refresh") {
    throw new Error(`Expected forced_refresh reason, got ${forcedReason}`);
  }

  if (sparseReason !== "sparse_broad_local") {
    throw new Error(`Expected sparse_broad_local reason, got ${sparseReason}`);
  }

  if (genericReason !== "provider_used") {
    throw new Error(`Expected provider_used reason, got ${genericReason}`);
  }
});

Deno.test("Fresh sparse broad page can serve local cache without repeated provider refresh", () => {
  const freshSparseBroad = getBroadSparseFreshLocalSufficientForTesting(
    "broad",
    1,
    true,
    3,
    0,
  );
  const staleSparseBroad = getBroadSparseFreshLocalSufficientForTesting(
    "broad",
    1,
    true,
    3,
    1,
  );
  const oneStaleInThreeSparseBroad = getBroadSparseFreshLocalSufficientForTesting(
    "broad",
    1,
    true,
    3,
    1 / 3,
  );
  const emptySparseBroad = getBroadSparseFreshLocalSufficientForTesting(
    "broad",
    1,
    true,
    0,
    0,
  );
  const specificQuery = getBroadSparseFreshLocalSufficientForTesting(
    "specific",
    1,
    true,
    3,
    0,
  );

  if (!freshSparseBroad) {
    throw new Error("Expected fresh sparse broad page to be cache-sufficient");
  }

  if (staleSparseBroad) {
    throw new Error("Expected stale sparse broad page to require provider");
  }

  if (!oneStaleInThreeSparseBroad) {
    throw new Error(
      "Expected sparse broad page with one stale item in three visible results to stay local",
    );
  }

  if (emptySparseBroad) {
    throw new Error("Expected empty sparse broad page to require provider");
  }

  if (specificQuery) {
    throw new Error("Expected specific queries not to use sparse-broad cache override");
  }
});

Deno.test("Sparse visible broad local page triggers provider fallback even with larger local total", () => {
  const query = "wolverine";
  const visibleLegacy = createTitleSummary("rawg:wolverine-legacy", "Wolverine", {
    rawgRating: 3.6,
    rawgRatingsCount: 240,
    rawgMetacritic: 66,
    rawgAdded: 1800,
    rawgReviewsCount: 90,
    rawgSuggestionsCount: 18,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const visibleOrigins = createTitleSummary(
    "rawg:wolverine-origins",
    "X-Men Origins: Wolverine",
    {
      rawgRating: 4.1,
      rawgRatingsCount: 1800,
      rawgMetacritic: 75,
      rawgAdded: 9000,
      rawgReviewsCount: 700,
      rawgSuggestionsCount: 220,
      rawgRatingTop: 4,
      platforms: [{ id: "rawg-platform:xbox", name: "Xbox 360" }],
    },
  );
  const visibleRevenge = createTitleSummary(
    "rawg:wolverine-revenge",
    "X2: Wolverine's Revenge",
    {
      rawgRating: 3.8,
      rawgRatingsCount: 620,
      rawgMetacritic: 70,
      rawgAdded: 3400,
      rawgReviewsCount: 210,
      rawgSuggestionsCount: 62,
      rawgRatingTop: 4,
      platforms: [{ id: "rawg-platform:ps2", name: "PlayStation 2" }],
    },
  );
  const lowTailA = createTitleSummary("rawg:wolverine-tail-a", "Golfin Wolverine ByMy", {
    rawgRating: 1.8,
    rawgRatingsCount: 2,
    rawgMetacritic: 15,
    rawgAdded: 8,
    rawgReviewsCount: 1,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 1,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const lowTailB = createTitleSummary("rawg:wolverine-tail-b", "the wolverine", {
    rawgRating: 2.2,
    rawgRatingsCount: 8,
    rawgMetacritic: 25,
    rawgAdded: 30,
    rawgReviewsCount: 3,
    rawgSuggestionsCount: 1,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:mac", name: "macOS" }],
  });

  const localPolicyPageCount = getLocalPolicyPageCountForTesting(
    [visibleLegacy, visibleOrigins, visibleRevenge, lowTailA, lowTailB],
    query,
    "broad",
    1,
    20,
  );
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: localPolicyPageCount,
    localTotalCount: 24,
    staleRatio: 0,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (localPolicyPageCount >= 5) {
    throw new Error(
      `Expected denoised visible broad page count below threshold, got ${localPolicyPageCount}`,
    );
  }

  if (!policy.needsProvider) {
    throw new Error("Expected provider fallback when visible broad page is sparse");
  }
});

Deno.test("Single-token franchise queries are treated as broad intent", () => {
  const spiderman = inferQuerySearchOptionsForTesting("spiderman");
  const wolverine = inferQuerySearchOptionsForTesting("wolverine");
  const marvel = inferQuerySearchOptionsForTesting("marvel");
  const witcherThree = inferQuerySearchOptionsForTesting("witcher 3");

  if (spiderman.intentMode !== "broad") {
    throw new Error(`Expected spiderman to be broad, got ${spiderman.intentMode}`);
  }

  if (wolverine.intentMode !== "broad") {
    throw new Error(`Expected wolverine to be broad, got ${wolverine.intentMode}`);
  }

  if (marvel.intentMode !== "broad") {
    throw new Error(`Expected marvel to be broad, got ${marvel.intentMode}`);
  }

  if (witcherThree.intentMode !== "specific") {
    throw new Error(
      `Expected multi-token numeric title query to stay specific, got ${witcherThree.intentMode}`,
    );
  }
});

Deno.test("Ranking V2: broad franchise query demotes simulator and alpha noise", () => {
  const query = "spiderman";
  const canonical = createTitleSummary("rawg:spider-man-2018", "Marvel's Spider-Man", {
    rawgRating: 4.7,
    rawgRatingsCount: 9500,
    rawgMetacritic: 87,
    rawgAdded: 22000,
    rawgReviewsCount: 5000,
    rawgSuggestionsCount: 1200,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const simulator = createTitleSummary("rawg:spiderman-simulator", "Spiderman Simulator", {
    rawgRating: 2.3,
    rawgRatingsCount: 18,
    rawgMetacritic: 38,
    rawgAdded: 90,
    rawgReviewsCount: 8,
    rawgSuggestionsCount: 2,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const alpha = createTitleSummary("rawg:spiderman-alpha", "Spiderman: Free-Swing Alpha", {
    rawgRating: 2.2,
    rawgRatingsCount: 18,
    rawgMetacritic: 35,
    rawgAdded: 90,
    rawgReviewsCount: 7,
    rawgSuggestionsCount: 2,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting(
    [simulator, alpha, canonical],
    query,
    "broad",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical Spider-Man first for broad franchise query, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad franchise query demotes vendor suffix and demake noise", () => {
  const query = "wolverine";
  const canonical = createTitleSummary("rawg:marvel-wolverine", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const vendorSuffix = createTitleSummary(
    "rawg:wolverine-soft",
    "Starship Slime (Wolverine Soft)",
    {
      rawgRating: 2.1,
      rawgRatingsCount: 6,
      rawgMetacritic: 20,
      rawgAdded: 15,
      rawgReviewsCount: 2,
      rawgSuggestionsCount: 1,
      rawgRatingTop: 1,
      platforms: [{ id: "rawg-platform:linux", name: "Linux" }],
    },
  );
  const demake = createTitleSummary("rawg:wolverine-demake", "Wolverine Demake", {
    rawgRating: 2.4,
    rawgRatingsCount: 16,
    rawgMetacritic: 33,
    rawgAdded: 70,
    rawgReviewsCount: 6,
    rawgSuggestionsCount: 2,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting(
    [vendorSuffix, demake, canonical],
    query,
    "broad",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical Wolverine first for broad franchise query, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: specific sequel query requires non-numeric franchise match", () => {
  const query = "spiderman 2";
  const canonical = createTitleSummary(
    "rawg:spider-man-2",
    "Marvel's Spider-Man 2",
    {
      rawgRating: 4.8,
      rawgRatingsCount: 12000,
      rawgMetacritic: 90,
      rawgAdded: 34000,
      rawgReviewsCount: 5200,
      rawgSuggestionsCount: 1600,
      rawgRatingTop: 5,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const syberia = createTitleSummary("rawg:syberia-2", "Syberia 2", {
    rawgRating: 4.0,
    rawgRatingsCount: 2200,
    rawgMetacritic: 82,
    rawgAdded: 9000,
    rawgReviewsCount: 800,
    rawgSuggestionsCount: 260,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const overwatch = createTitleSummary("rawg:overwatch-2", "Overwatch 2", {
    rawgRating: 4.2,
    rawgRatingsCount: 15000,
    rawgMetacritic: 79,
    rawgAdded: 25000,
    rawgReviewsCount: 4200,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting(
    [syberia, overwatch, canonical],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected Spider-Man 2 first for specific sequel query, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: working sequel query still prefers the canonical Witcher title", () => {
  const query = "witcher 3";
  const canonical = createTitleSummary(
    "rawg:witcher-3",
    "The Witcher 3: Wild Hunt",
    {
      rawgRating: 4.9,
      rawgRatingsCount: 18000,
      rawgMetacritic: 93,
      rawgAdded: 45000,
      rawgReviewsCount: 9000,
      rawgSuggestionsCount: 2400,
      rawgRatingTop: 5,
      platforms: [{ id: "rawg-platform:pc", name: "PC" }],
    },
  );
  const otherThree = createTitleSummary("rawg:drawful-2", "Drawful 2", {
    rawgRating: 3.7,
    rawgRatingsCount: 500,
    rawgMetacritic: 70,
    rawgAdded: 3000,
    rawgReviewsCount: 200,
    rawgSuggestionsCount: 40,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const ranked = rankResultsForTesting(
    [otherThree, canonical],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected Witcher 3 first for sequel query, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: apostrophe-less branded query still finds canonical Spider-Man title", () => {
  const query = "marvels spiderman";
  const canonical = createTitleSummary(
    "rawg:marvels-spider-man",
    "Marvel's Spider-Man",
    {
      rawgRating: 4.7,
      rawgRatingsCount: 9500,
      rawgMetacritic: 87,
      rawgAdded: 22000,
      rawgReviewsCount: 5000,
      rawgSuggestionsCount: 1200,
      rawgRatingTop: 5,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const olderLiteral = createTitleSummary("rawg:spider-man-2000", "Spider-Man (2000)", {
    rawgRating: 3.8,
    rawgRatingsCount: 1200,
    rawgMetacritic: 74,
    rawgAdded: 6000,
    rawgReviewsCount: 500,
    rawgSuggestionsCount: 140,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:ps1", name: "PlayStation" }],
  });

  const ranked = rankResultsForTesting(
    [olderLiteral, canonical],
    query,
    "specific",
    true,
  );

  if (ranked[0]?.id !== canonical.id) {
    throw new Error(
      `Expected canonical branded Spider-Man title first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad franchise query promotes high-signal branded title over weak literal exact", () => {
  const query = "wolverine";
  const weakLiteral = createTitleSummary("rawg:wolverine-1991", "Wolverine", {
    rawgRating: 2.9,
    rawgRatingsCount: 14,
    rawgMetacritic: 48,
    rawgAdded: 80,
    rawgReviewsCount: 12,
    rawgSuggestionsCount: 3,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const flagship = createTitleSummary("rawg:marvels-wolverine", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });

  const ranked = rankResultsForTesting(
    [weakLiteral, flagship],
    query,
    "broad",
    true,
  );

  if (ranked[0]?.id !== flagship.id) {
    throw new Error(
      `Expected high-signal branded Wolverine title first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Ranking V2: broad franchise query can elevate a flagship title above legacy literal matches", () => {
  const query = "wolverine";
  const literal = createTitleSummary("rawg:wolverine", "Wolverine", {
    rawgRating: 3.6,
    rawgRatingsCount: 240,
    rawgMetacritic: 66,
    rawgAdded: 1800,
    rawgReviewsCount: 90,
    rawgSuggestionsCount: 18,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const legacy = createTitleSummary("rawg:adamantium", "Wolverine: Adamantium Rage", {
    rawgRating: 3.9,
    rawgRatingsCount: 340,
    rawgMetacritic: 72,
    rawgAdded: 2400,
    rawgReviewsCount: 140,
    rawgSuggestionsCount: 26,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:snes", name: "SNES" }],
  });
  const flagship = createTitleSummary("rawg:marvels-wolverine-flagship", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });

  const ranked = rankResultsForTesting(
    [literal, legacy, flagship],
    query,
    "broad",
    true,
  );

  if (ranked[0]?.id !== flagship.id) {
    throw new Error(
      `Expected flagship Wolverine title first, got ${ranked[0]?.id ?? "none"}`,
    );
  }
});

Deno.test("Broad franchise denoise hides low-quality tail once enough strong results exist", () => {
  const query = "wolverine";
  const flagship = createTitleSummary("rawg:flagship", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const origins = createTitleSummary("rawg:origins", "X-Men Origins: Wolverine", {
    rawgRating: 4.1,
    rawgRatingsCount: 1800,
    rawgMetacritic: 75,
    rawgAdded: 9000,
    rawgReviewsCount: 700,
    rawgSuggestionsCount: 220,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:xbox", name: "Xbox 360" }],
  });
  const adamantium = createTitleSummary(
    "rawg:adamantium",
    "Wolverine: Adamantium Rage",
    {
      rawgRating: 3.9,
      rawgRatingsCount: 340,
      rawgMetacritic: 72,
      rawgAdded: 2400,
      rawgReviewsCount: 140,
      rawgSuggestionsCount: 26,
      rawgRatingTop: 4,
      platforms: [{ id: "rawg-platform:snes", name: "SNES" }],
    },
  );
  const literal = createTitleSummary("rawg:literal", "Wolverine", {
    rawgRating: 3.6,
    rawgRatingsCount: 240,
    rawgMetacritic: 66,
    rawgAdded: 1800,
    rawgReviewsCount: 90,
    rawgSuggestionsCount: 18,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const junk = createTitleSummary("rawg:junk", "Golfin Wolverine ByMy", {
    rawgRating: 1.8,
    rawgRatingsCount: 2,
    rawgMetacritic: 15,
    rawgAdded: 8,
    rawgReviewsCount: 1,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 1,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const filler = createTitleSummary("rawg:filler", "the wolverine", {
    rawgRating: 2.2,
    rawgRatingsCount: 8,
    rawgMetacritic: 25,
    rawgAdded: 30,
    rawgReviewsCount: 3,
    rawgSuggestionsCount: 1,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:mac", name: "macOS" }],
  });

  const merged = mergeResultsForTesting(
    [flagship, origins, adamantium, literal, junk, filler],
    [],
    query,
    "broad",
    1,
    20,
  );

  if (merged.results.length >= 6) {
    throw new Error(`Expected broad franchise denoise to reduce the tail, got ${merged.results.length} results`);
  }

  if (merged.results.some((result: TitleSummary) => result.id === junk.id || result.id === filler.id)) {
    throw new Error("Expected low-quality franchise tail entries to be removed");
  }

  if (!merged.results.some((result: TitleSummary) => result.id === flagship.id)) {
    throw new Error("Expected flagship franchise result to remain after denoise");
  }
});

Deno.test("Broad franchise denoise falls back to original results when pruning would leave too few entries", () => {
  const query = "wolverine";
  const flagship = createTitleSummary("rawg:flagship-min", "Marvel's Wolverine", {
    rawgRating: 4.8,
    rawgRatingsCount: 3200,
    rawgMetacritic: 88,
    rawgAdded: 28000,
    rawgReviewsCount: 1400,
    rawgSuggestionsCount: 900,
    rawgRatingTop: 5,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const junkA = createTitleSummary("rawg:junk-a", "Golfin Wolverine ByMy", {
    rawgRating: 1.8,
    rawgRatingsCount: 2,
    rawgMetacritic: 15,
    rawgAdded: 8,
    rawgReviewsCount: 1,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 1,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });
  const junkB = createTitleSummary("rawg:junk-b", "the wolverine", {
    rawgRating: 2.2,
    rawgRatingsCount: 8,
    rawgMetacritic: 25,
    rawgAdded: 30,
    rawgReviewsCount: 3,
    rawgSuggestionsCount: 1,
    rawgRatingTop: 2,
    platforms: [{ id: "rawg-platform:mac", name: "macOS" }],
  });

  const merged = mergeResultsForTesting(
    [flagship, junkA, junkB],
    [],
    query,
    "broad",
    1,
    20,
  );

  if (merged.results.length !== 3) {
    throw new Error(
      `Expected fallback to keep original list size 3, got ${merged.results.length}`,
    );
  }
});

Deno.test("Broad franchise denoise keeps anticipated mainstream title even when other quality signals are weak", () => {
  const query = "wolverine";
  const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const anticipated = createTitleSummary("rawg:anticipated", "Marvel's Wolverine", {
    rawgRating: null,
    rawgRatingsCount: 20,
    rawgMetacritic: null,
    rawgAdded: 12000,
    rawgReviewsCount: 5,
    rawgSuggestionsCount: 2,
    rawgRatingTop: null,
    earliestReleaseDate: futureDate,
    platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
  });
  const origins = createTitleSummary("rawg:origins-safe", "X-Men Origins: Wolverine", {
    rawgRating: 4.1,
    rawgRatingsCount: 1800,
    rawgMetacritic: 75,
    rawgAdded: 9000,
    rawgReviewsCount: 700,
    rawgSuggestionsCount: 220,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:xbox", name: "Xbox 360" }],
  });
  const literal = createTitleSummary("rawg:literal-safe", "Wolverine", {
    rawgRating: 3.6,
    rawgRatingsCount: 240,
    rawgMetacritic: 66,
    rawgAdded: 1800,
    rawgReviewsCount: 90,
    rawgSuggestionsCount: 18,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const junk = createTitleSummary("rawg:junk-protected-check", "Golfin Wolverine ByMy", {
    rawgRating: 1.8,
    rawgRatingsCount: 2,
    rawgMetacritic: 15,
    rawgAdded: 8,
    rawgReviewsCount: 1,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 1,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const merged = mergeResultsForTesting(
    [anticipated, origins, literal, junk],
    [],
    query,
    "broad",
    1,
    20,
  );

  if (!merged.results.some((result: TitleSummary) => result.id === anticipated.id)) {
    throw new Error("Expected anticipated mainstream title to remain after denoise");
  }

  if (merged.results.some((result: TitleSummary) => result.id === junk.id)) {
    throw new Error("Expected low-quality junk tail entry to be removed");
  }
});

Deno.test("Broad franchise denoise keeps low-engagement future mainstream title", () => {
  const query = "wolverine";
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const anticipatedLowSignal = createTitleSummary(
    "rawg:anticipated-low-signal",
    "Marvel's Wolverine",
    {
      rawgRating: null,
      rawgRatingsCount: 4,
      rawgMetacritic: null,
      rawgAdded: 40,
      rawgReviewsCount: 1,
      rawgSuggestionsCount: 0,
      rawgRatingTop: null,
      earliestReleaseDate: futureDate,
      platforms: [{ id: "rawg-platform:ps5", name: "PlayStation 5" }],
    },
  );
  const legacy = createTitleSummary("rawg:legacy-safe", "Wolverine", {
    rawgRating: 3.6,
    rawgRatingsCount: 240,
    rawgMetacritic: 66,
    rawgAdded: 1800,
    rawgReviewsCount: 90,
    rawgSuggestionsCount: 18,
    rawgRatingTop: 4,
    platforms: [{ id: "rawg-platform:nes", name: "NES" }],
  });
  const junk = createTitleSummary("rawg:junk-future-protection-check", "Golfin Wolverine ByMy", {
    rawgRating: 1.8,
    rawgRatingsCount: 2,
    rawgMetacritic: 15,
    rawgAdded: 8,
    rawgReviewsCount: 1,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 1,
    platforms: [{ id: "rawg-platform:pc", name: "PC" }],
  });

  const merged = mergeResultsForTesting(
    [anticipatedLowSignal, legacy, junk],
    [],
    query,
    "broad",
    1,
    20,
  );

  if (!merged.results.some((result: TitleSummary) => result.id === anticipatedLowSignal.id)) {
    throw new Error("Expected low-engagement future mainstream title to remain");
  }
});
