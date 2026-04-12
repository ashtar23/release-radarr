import assert from "node:assert/strict";
import test from "node:test";

import type { TitleSummary } from "@repo/types";

import {
  buildHomeDiscoveryPageResult,
  decodeHomeDiscoveryCursor,
  normalizeHomeDiscoveryPageLimit,
} from "./home-discovery-page";

test("normalizeHomeDiscoveryPageLimit applies defaults and bounds", () => {
  assert.equal(normalizeHomeDiscoveryPageLimit(undefined), 20);
  assert.equal(normalizeHomeDiscoveryPageLimit(0), 20);
  assert.equal(normalizeHomeDiscoveryPageLimit(100), 50);
  assert.equal(normalizeHomeDiscoveryPageLimit(12), 12);
});

test("buildHomeDiscoveryPageResult returns items and a stable upcoming cursor", () => {
  const rows = [
    createTitleSummary("rawg:1", "Alpha", {
      earliestReleaseDate: "2026-04-10",
      rawgAdded: 200,
    }),
    createTitleSummary("rawg:2", "Beta", {
      earliestReleaseDate: "2026-04-11",
      rawgAdded: 180,
    }),
    createTitleSummary("rawg:3", "Gamma", {
      earliestReleaseDate: "2026-04-12",
      rawgAdded: 150,
    }),
  ];

  const result = buildHomeDiscoveryPageResult({
    section: "upcoming",
    rows,
    limit: 2,
  });

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["rawg:1", "rawg:2"],
  );
  assert.ok(result.nextCursor);
  assert.deepEqual(decodeHomeDiscoveryCursor(result.nextCursor!, "upcoming"), {
    section: "upcoming",
    date: "2026-04-11",
    added: 180,
    id: "rawg:2",
  });
});

test("buildHomeDiscoveryPageResult uses the popular sort payload in its cursor", () => {
  const rows = [
    createTitleSummary("rawg:4", "Popular One", {
      earliestReleaseDate: "2026-05-01",
      rawgAdded: 900,
      rawgRatingsCount: 40,
      rawgSuggestionsCount: 300,
    }),
    createTitleSummary("rawg:5", "Popular Two", {
      earliestReleaseDate: "2026-05-02",
      rawgAdded: 850,
      rawgRatingsCount: 32,
      rawgSuggestionsCount: 220,
    }),
  ];

  const result = buildHomeDiscoveryPageResult({
    section: "popular",
    rows,
    limit: 1,
  });

  assert.ok(result.nextCursor);
  assert.deepEqual(decodeHomeDiscoveryCursor(result.nextCursor!, "popular"), {
    section: "popular",
    added: 900,
    ratingsCount: 40,
    suggestionsCount: 300,
    id: "rawg:4",
  });
});

test("decodeHomeDiscoveryCursor rejects mismatched or malformed cursors", () => {
  const upcoming = buildHomeDiscoveryPageResult({
    section: "upcoming",
    rows: [
      createTitleSummary("rawg:6", "Mismatch", {
        earliestReleaseDate: "2026-04-22",
        rawgAdded: 77,
      }),
      createTitleSummary("rawg:7", "Mismatch 2", {
        earliestReleaseDate: "2026-04-23",
        rawgAdded: 70,
      }),
    ],
    limit: 1,
  });

  assert.equal(decodeHomeDiscoveryCursor("not-base64", "upcoming"), null);
  assert.equal(
    decodeHomeDiscoveryCursor(upcoming.nextCursor!, "popular"),
    null,
  );
});

test("buildHomeDiscoveryPageResult removes obvious title variants before paging", () => {
  const rows = [
    createTitleSummary("rawg:8", "Mixtape (2025)", {
      earliestReleaseDate: "2026-05-07",
      rawgAdded: 30,
    }),
    createTitleSummary("rawg:9", "Mixtape", {
      earliestReleaseDate: "2026-05-07",
      rawgAdded: 2,
    }),
    createTitleSummary("rawg:10", "Gamma", {
      earliestReleaseDate: "2026-05-08",
      rawgAdded: 10,
    }),
  ];

  const result = buildHomeDiscoveryPageResult({
    section: "upcoming",
    rows,
    limit: 2,
  });

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["rawg:8", "rawg:10"],
  );
});

function createTitleSummary(
  id: string,
  name: string,
  overrides: Partial<TitleSummary>,
): TitleSummary {
  return {
    id,
    kind: "game",
    source: "rawg",
    externalId: id.replace("rawg:", ""),
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
