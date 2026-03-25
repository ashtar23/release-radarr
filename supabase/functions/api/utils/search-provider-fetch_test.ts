import type { RawgSearchPage } from "../types.ts";
import { tryFetchRawgSearchResultsWithBudget } from "./search-provider-fetch.ts";

const TEST_KEY = "test-key";

function createPage(totalCount: number | null, ids: string[]): RawgSearchPage {
  return {
    totalCount,
    results: ids.map((id) => ({
      id,
      kind: "game",
      source: "rawg",
      externalId: id.replace("rawg:", ""),
      slug: id.replace("rawg:", ""),
      name: id,
      coverImageUrl: null,
      earliestReleaseDate: null,
      platforms: [],
      rawgRating: null,
      rawgRatingsCount: null,
      rawgMetacritic: null,
      rawgAdded: null,
      rawgReviewsCount: null,
      rawgSuggestionsCount: null,
      rawgRatingTop: null,
    })),
  };
}

Deno.test("provider fetch budget aggregates additional pages in order", async () => {
  const calls: number[] = [];
  const result = await tryFetchRawgSearchResultsWithBudget(
    "witcher",
    1,
    2,
    false,
    false,
    TEST_KEY,
    3,
    async (_query, requestedPage) => {
      calls.push(requestedPage);
      if (requestedPage === 1) {
        return createPage(10, ["rawg:1", "rawg:2"]);
      }

      if (requestedPage === 2) {
        return createPage(10, ["rawg:3", "rawg:4"]);
      }

      if (requestedPage === 3) {
        return createPage(10, ["rawg:5", "rawg:6"]);
      }

      return null;
    },
  );

  if (!result) {
    throw new Error("Expected aggregated page result.");
  }

  if (calls.join(",") !== "1,2,3") {
    throw new Error(`Expected calls for pages 1,2,3. Got: ${calls.join(",")}`);
  }

  const ids = result.results.map((entry) => entry.id).join(",");
  if (ids !== "rawg:1,rawg:2,rawg:3,rawg:4,rawg:5,rawg:6") {
    throw new Error(`Unexpected aggregated id order: ${ids}`);
  }
});

Deno.test("provider fetch budget dispatches post-first pages in parallel", async () => {
  let page2Resolved = false;
  let page3StartedBeforePage2Resolved = false;

  await tryFetchRawgSearchResultsWithBudget(
    "zelda",
    1,
    2,
    false,
    false,
    TEST_KEY,
    3,
    async (_query, requestedPage) => {
      if (requestedPage === 1) {
        return createPage(10, ["rawg:1", "rawg:2"]);
      }

      if (requestedPage === 2) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        page2Resolved = true;
        return createPage(10, ["rawg:3", "rawg:4"]);
      }

      if (requestedPage === 3) {
        page3StartedBeforePage2Resolved = !page2Resolved;
        return createPage(10, ["rawg:5", "rawg:6"]);
      }

      return null;
    },
  );

  if (!page3StartedBeforePage2Resolved) {
    throw new Error(
      "Expected page 3 request to start before page 2 resolved (parallel dispatch).",
    );
  }
});

Deno.test("provider fetch budget preserves stop-on-gap behavior", async () => {
  const result = await tryFetchRawgSearchResultsWithBudget(
    "bloodborne",
    1,
    2,
    false,
    false,
    TEST_KEY,
    3,
    async (_query, requestedPage) => {
      if (requestedPage === 1) {
        return createPage(10, ["rawg:1", "rawg:2"]);
      }

      if (requestedPage === 2) {
        return null;
      }

      if (requestedPage === 3) {
        return createPage(10, ["rawg:5", "rawg:6"]);
      }

      return null;
    },
  );

  if (!result) {
    throw new Error("Expected first page result to be returned.");
  }

  const ids = result.results.map((entry) => entry.id).join(",");
  if (ids !== "rawg:1,rawg:2") {
    throw new Error(
      `Expected aggregation to stop after first missing page. Got: ${ids}`,
    );
  }
});
