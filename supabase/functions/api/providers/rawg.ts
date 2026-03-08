import { RAWG_BASE_URL } from "../config.ts";
import {
  mapNamedList,
  mapRawgSearchGameToSummary,
  normalizeRawgReleases,
} from "../mapping/titles.ts";
import type {
  RawgDetailGame,
  RawgSearchResponse,
  TitleDetails,
  TitleSummary,
} from "../types.ts";

export async function fetchRawgSearchResults(
  query: string,
  limit: number,
  rawgApiKey: string,
): Promise<TitleSummary[]> {
  const searchUrl = new URL(RAWG_BASE_URL);
  searchUrl.searchParams.set("key", rawgApiKey);
  searchUrl.searchParams.set("search", query);
  searchUrl.searchParams.set("page_size", String(limit));

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`RAWG search failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as RawgSearchResponse;
  const games = payload.results ?? [];
  return games.map(mapRawgSearchGameToSummary);
}

export async function fetchRawgDetail(
  externalId: string,
  rawgApiKey: string,
): Promise<TitleDetails> {
  const detailUrl = new URL(`${RAWG_BASE_URL}/${externalId}`);
  detailUrl.searchParams.set("key", rawgApiKey);

  const response = await fetch(detailUrl);
  if (!response.ok) {
    throw new Error(`RAWG detail failed with status ${response.status}.`);
  }

  const game = (await response.json()) as RawgDetailGame;
  const summary = mapRawgSearchGameToSummary(game);
  const releases = normalizeRawgReleases(game.platforms);

  return {
    ...summary,
    description: game.description_raw ?? null,
    genres: mapNamedList(game.genres),
    developers: mapNamedList(game.developers),
    publishers: mapNamedList(game.publishers),
    websiteUrl:
      typeof game.website === "string" && game.website.length
        ? game.website
        : null,
    releases,
  };
}
