import test from "node:test";
import assert from "node:assert/strict";
import type { TitleSummary } from "@repo/types";

import { selectHomeDiscoveryRails } from "./home-discovery-selection";

test("selectHomeDiscoveryRails filters low-signal entries and dedupes across rails", () => {
  const sharedUpcoming = createTitleSummary("rawg:1", "Shared Upcoming", {
    earliestReleaseDate: "2026-04-12",
    rawgAdded: 120,
    rawgSuggestionsCount: 90,
  });
  const weakUpcoming = createTitleSummary("rawg:2", "Weak Upcoming", {
    earliestReleaseDate: "2026-04-15",
    rawgAdded: 1,
    rawgSuggestionsCount: 0,
    rawgRatingsCount: 0,
  });
  const recentHit = createTitleSummary("rawg:3", "Recent Hit", {
    earliestReleaseDate: "2026-04-08",
    rawgAdded: 40,
    rawgReviewsCount: 8,
  });
  const latestDuplicate = createTitleSummary("rawg:1", "Shared Upcoming", {
    earliestReleaseDate: "2026-04-12",
    rawgAdded: 120,
    rawgSuggestionsCount: 90,
  });
  const timelessClassic = createTitleSummary("rawg:4", "Timeless Classic", {
    earliestReleaseDate: "2013-09-17",
    rawgAdded: 22000,
    rawgRatingsCount: 7000,
    rawgMetacritic: 96,
  });
  const worthWatchingNow = createTitleSummary("rawg:5", "Worth Watching Now", {
    earliestReleaseDate: "2026-05-10",
    rawgAdded: 400,
    rawgRatingsCount: 25,
    rawgSuggestionsCount: 120,
    rawgMetacritic: 84,
  });

  const result = selectHomeDiscoveryRails({
    upcomingCandidates: [sharedUpcoming, weakUpcoming],
    latestCandidates: [latestDuplicate, recentHit],
    popularCandidates: [timelessClassic, worthWatchingNow],
    todayIsoDate: "2026-04-09",
    limit: 10,
  });

  assert.deepEqual(
    result.upcoming.map((title) => title.id),
    ["rawg:1"],
  );
  assert.deepEqual(
    result.latest.map((title) => title.id),
    ["rawg:3"],
  );
  assert.deepEqual(
    result.popular.map((title) => title.id),
    ["rawg:5"],
  );
});

test("selectHomeDiscoveryRails prefers stronger near-term popular titles over weak filler", () => {
  const weakLatest = createTitleSummary("rawg:6", "Weak Latest", {
    earliestReleaseDate: "2026-04-07",
    rawgAdded: 2,
    rawgReviewsCount: 0,
    rawgSuggestionsCount: 0,
  });
  const lowSignalPopular = createTitleSummary("rawg:7", "Low Signal Popular", {
    earliestReleaseDate: "2026-06-01",
    rawgAdded: 3,
    rawgRatingsCount: 0,
    rawgSuggestionsCount: 1,
  });
  const strongPopular = createTitleSummary("rawg:8", "Strong Popular", {
    earliestReleaseDate: "2026-06-15",
    rawgAdded: 500,
    rawgRatingsCount: 30,
    rawgSuggestionsCount: 150,
    rawgMetacritic: 88,
  });

  const result = selectHomeDiscoveryRails({
    upcomingCandidates: [],
    latestCandidates: [weakLatest],
    popularCandidates: [lowSignalPopular, strongPopular],
    todayIsoDate: "2026-04-09",
    limit: 10,
  });

  assert.equal(result.latest.length, 0);
  assert.deepEqual(
    result.popular.map((title) => title.id),
    ["rawg:8"],
  );
});

test("selectHomeDiscoveryRails removes obvious year-suffixed title variants", () => {
  const mixtapeVariant = createTitleSummary("rawg:9", "Mixtape (2025)", {
    earliestReleaseDate: "2026-05-07",
    rawgAdded: 30,
    rawgSuggestionsCount: 174,
  });
  const mixtapeBase = createTitleSummary("rawg:10", "Mixtape", {
    earliestReleaseDate: "2026-05-07",
    rawgAdded: 2,
    rawgSuggestionsCount: 97,
  });

  const result = selectHomeDiscoveryRails({
    upcomingCandidates: [mixtapeVariant, mixtapeBase],
    latestCandidates: [],
    popularCandidates: [],
    todayIsoDate: "2026-04-09",
    limit: 10,
  });

  assert.deepEqual(
    result.upcoming.map((title) => title.id),
    ["rawg:9"],
  );
});

function createTitleSummary(
  id: string,
  name: string,
  overrides: Partial<TitleSummary>,
): TitleSummary {
  const externalId = id.replace("rawg:", "");

  return {
    id,
    kind: "game",
    source: "rawg",
    externalId,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    coverImageUrl: "https://example.com/cover.jpg",
    earliestReleaseDate: "2026-04-10",
    platforms: [{ id: "rawg-platform:4", name: "PC" }],
    rawgRating: null,
    rawgRatingsCount: 0,
    rawgMetacritic: null,
    rawgAdded: 10,
    rawgReviewsCount: 0,
    rawgSuggestionsCount: 0,
    rawgRatingTop: 0,
    ...overrides,
  };
}
