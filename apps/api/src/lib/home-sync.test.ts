import test from "node:test";
import assert from "node:assert/strict";
import type { TitleSummary } from "@repo/types";

import {
  buildHomeSyncCandidateGroups,
  mergeUniqueTitleSummaries,
} from "./home-sync-plan";
import { syncHomeDiscovery } from "./home-sync";

test("buildHomeSyncCandidateGroups returns three bounded daily candidate groups", () => {
  const groups = buildHomeSyncCandidateGroups("2026-04-09");

  assert.deepEqual(
    groups.map((group) => group.key),
    ["upcoming", "latest", "popular"],
  );

  assert.deepEqual(groups[0], {
    key: "upcoming",
    pageSize: 40,
    ordering: "-added",
    dates: "2026-04-09,2027-04-09",
  });

  assert.deepEqual(groups[1], {
    key: "latest",
    pageSize: 40,
    ordering: "-released",
    dates: "2026-02-08,2026-04-09",
  });

  assert.deepEqual(groups[2], {
    key: "popular",
    pageSize: 40,
    ordering: "-added",
    dates: "2026-01-09,2026-10-06",
  });
});

test("mergeUniqueTitleSummaries preserves first-seen order and dedupes by id", () => {
  const merged = mergeUniqueTitleSummaries([
    [
      {
        id: "rawg:1",
        kind: "game",
        source: "rawg",
        externalId: "1",
        slug: "alpha",
        name: "Alpha",
        coverImageUrl: null,
        earliestReleaseDate: "2026-04-10",
        platforms: [],
        rawgRating: null,
        rawgRatingsCount: null,
        rawgMetacritic: null,
        rawgAdded: 100,
        rawgReviewsCount: null,
        rawgSuggestionsCount: null,
        rawgRatingTop: null,
      },
      {
        id: "rawg:2",
        kind: "game",
        source: "rawg",
        externalId: "2",
        slug: "beta",
        name: "Beta",
        coverImageUrl: null,
        earliestReleaseDate: "2026-04-11",
        platforms: [],
        rawgRating: null,
        rawgRatingsCount: null,
        rawgMetacritic: null,
        rawgAdded: 90,
        rawgReviewsCount: null,
        rawgSuggestionsCount: null,
        rawgRatingTop: null,
      },
    ],
    [
      {
        id: "rawg:2",
        kind: "game",
        source: "rawg",
        externalId: "2",
        slug: "beta",
        name: "Beta",
        coverImageUrl: null,
        earliestReleaseDate: "2026-04-11",
        platforms: [],
        rawgRating: null,
        rawgRatingsCount: null,
        rawgMetacritic: null,
        rawgAdded: 90,
        rawgReviewsCount: null,
        rawgSuggestionsCount: null,
        rawgRatingTop: null,
      },
      {
        id: "rawg:3",
        kind: "game",
        source: "rawg",
        externalId: "3",
        slug: "gamma",
        name: "Gamma",
        coverImageUrl: null,
        earliestReleaseDate: "2026-04-12",
        platforms: [],
        rawgRating: null,
        rawgRatingsCount: null,
        rawgMetacritic: null,
        rawgAdded: 80,
        rawgReviewsCount: null,
        rawgSuggestionsCount: null,
        rawgRatingTop: null,
      },
    ],
  ]);

  assert.deepEqual(
    merged.map((title) => title.id),
    ["rawg:1", "rawg:2", "rawg:3"],
  );
});

test("syncHomeDiscovery fetches all groups, dedupes once, and returns a stable summary", async () => {
  const alpha = createTitleSummary("rawg:1", "Alpha");
  const beta = createTitleSummary("rawg:2", "Beta");
  const gamma = createTitleSummary("rawg:3", "Gamma");

  const fetchedDates: string[] = [];
  const upsertCalls: TitleSummary[][] = [];
  const enrichCalls: Array<{ summaries: TitleSummary[]; rawgApiKey: string }> = [];

  const result = await syncHomeDiscovery(
    {
      rawgApiKey: "test-key",
      runDate: "2026-04-09",
    },
    {
      fetchDiscoveryResults: async (params) => {
        fetchedDates.push(params.dates ?? "");

        if (params.ordering === "-released") {
          return [beta, gamma];
        }

        if (params.dates?.startsWith("2026-04-09")) {
          return [alpha, beta];
        }

        return [gamma, alpha];
      },
      upsertSummaries: async (summaries) => {
        upsertCalls.push(summaries);
      },
      enrichSummaries: async (params) => {
        enrichCalls.push({
          summaries: params.summaries,
          rawgApiKey: params.rawgApiKey,
        });
        return 2;
      },
    },
  );

  assert.equal(fetchedDates.length, 3);
  assert.equal(upsertCalls.length, 1);
  assert.equal(enrichCalls.length, 1);

  assert.deepEqual(
    upsertCalls[0]?.map((summary) => summary.id),
    ["rawg:1", "rawg:2", "rawg:3"],
  );

  assert.deepEqual(
    enrichCalls[0]?.summaries.map((summary) => summary.id),
    ["rawg:1", "rawg:2", "rawg:3"],
  );

  assert.equal(enrichCalls[0]?.rawgApiKey, "test-key");

  assert.deepEqual(result, {
    runDate: "2026-04-09",
    candidateCounts: {
      upcoming: 2,
      latest: 2,
      popular: 2,
    },
    uniqueCandidateCount: 3,
    enrichedCandidateCount: 2,
  });
});

test("syncHomeDiscovery rejects missing RAWG credentials before any work runs", async () => {
  let fetchCalls = 0;

  await assert.rejects(
    syncHomeDiscovery(
      {
        rawgApiKey: "",
        runDate: "2026-04-09",
      },
      {
        fetchDiscoveryResults: async () => {
          fetchCalls += 1;
          return [];
        },
        upsertSummaries: async () => {},
        enrichSummaries: async () => 0,
      },
    ),
    /RAWG_API_KEY is required/,
  );

  assert.equal(fetchCalls, 0);
});

function createTitleSummary(id: string, name: string): TitleSummary {
  const externalId = id.replace("rawg:", "");

  return {
    id,
    kind: "game",
    source: "rawg",
    externalId,
    slug: name.toLowerCase(),
    name,
    coverImageUrl: null,
    earliestReleaseDate: "2026-04-10",
    platforms: [],
    rawgRating: null,
    rawgRatingsCount: null,
    rawgMetacritic: null,
    rawgAdded: 100,
    rawgReviewsCount: null,
    rawgSuggestionsCount: null,
    rawgRatingTop: null,
  };
}
