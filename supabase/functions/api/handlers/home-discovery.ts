import {
  listLatestTitles,
  listPopularTitles,
  listUpcomingTitles,
  upsertSearchResults,
} from "../data/titles-repository.ts";
import { fetchRawgDiscoveryResults } from "../providers/rawg.ts";
import type {
  AdminClient,
  HomeDiscoveryResult,
  TitleSummary,
} from "../types.ts";
import { jsonResponse } from "../utils/http.ts";

const DISCOVERY_LIMIT = 10;
const LOCAL_MIN_RESULTS = 6;
const LATEST_WINDOW_DAYS = 60;
const UPCOMING_WINDOW_DAYS = 365;

export async function handleHomeDiscoveryRequest(client: AdminClient) {
  const rawgApiKey = Deno.env.get("RAWG_API_KEY") ?? null;
  const today = new Date();
  const todayIsoDate = toIsoDate(today);
  const latestCutoffIsoDate = toIsoDate(addDays(today, -LATEST_WINDOW_DAYS));
  const upcomingCutoffIsoDate = toIsoDate(addDays(today, UPCOMING_WINDOW_DAYS));

  const [localUpcoming, localLatest, localPopular] = await Promise.all([
    listUpcomingTitles(client, todayIsoDate, DISCOVERY_LIMIT),
    listLatestTitles(
      client,
      latestCutoffIsoDate,
      todayIsoDate,
      DISCOVERY_LIMIT,
    ),
    listPopularTitles(client, DISCOVERY_LIMIT),
  ]);

  const [upcoming, latest, popular] = await Promise.all([
    resolveDiscoverySection({
      client,
      localResults: localUpcoming,
      rawgApiKey,
      fallback: () =>
        fetchRawgDiscoveryResults({
          rawgApiKey: requireRawgKey(rawgApiKey),
          pageSize: DISCOVERY_LIMIT,
          dates: `${todayIsoDate},${upcomingCutoffIsoDate}`,
          ordering: "released",
        }),
    }),
    resolveDiscoverySection({
      client,
      localResults: localLatest,
      rawgApiKey,
      fallback: () =>
        fetchRawgDiscoveryResults({
          rawgApiKey: requireRawgKey(rawgApiKey),
          pageSize: DISCOVERY_LIMIT,
          dates: `${latestCutoffIsoDate},${todayIsoDate}`,
          ordering: "-released",
        }),
    }),
    resolveDiscoverySection({
      client,
      localResults: localPopular,
      rawgApiKey,
      fallback: () =>
        fetchRawgDiscoveryResults({
          rawgApiKey: requireRawgKey(rawgApiKey),
          pageSize: DISCOVERY_LIMIT,
          ordering: "-added",
        }),
    }),
  ]);

  const payload: HomeDiscoveryResult = {
    upcoming,
    latest,
    popular,
  };

  return jsonResponse(payload);
}

async function resolveDiscoverySection(params: {
  client: AdminClient;
  localResults: TitleSummary[];
  rawgApiKey: string | null;
  fallback: () => Promise<TitleSummary[]>;
}) {
  if (
    params.localResults.length >= LOCAL_MIN_RESULTS ||
    params.rawgApiKey === null
  ) {
    return params.localResults.slice(0, DISCOVERY_LIMIT);
  }

  const providerResults = await params.fallback().catch(() => []);
  if (providerResults.length > 0) {
    await upsertSearchResults(
      params.client,
      providerResults,
      new Date().toISOString(),
    );
  }

  return dedupeTitles([...params.localResults, ...providerResults]).slice(
    0,
    DISCOVERY_LIMIT,
  );
}

function dedupeTitles(results: TitleSummary[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }

    seen.add(result.id);
    return true;
  });
}

function requireRawgKey(rawgApiKey: string | null) {
  if (!rawgApiKey) {
    throw new Error("RAWG_API_KEY is missing.");
  }

  return rawgApiKey;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
