import type { TitleSummary } from "../types.ts";
import { rankResultsForTesting } from "./search.ts";

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
