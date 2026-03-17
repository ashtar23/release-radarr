import { API_PATH_PREFIX } from "@repo/config";
import type { HealthStatus } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
import type { AddWatchlistItemInput } from "@repo/types";
import type { RemoveWatchlistItemInput } from "@repo/types";
import type { WatchlistItem } from "@repo/types";
import type { WatchlistListResult } from "@repo/types";
import type { WatchlistUpsertResult } from "@repo/types";
export {
  initializeSupabaseClient,
  type InitializedSupabaseClient,
  type InitializeSupabaseClientOptions,
} from "./supabase-client";

export interface ReleaseRadarApiClientOptions {
  readonly baseUrl: string;
  readonly publishableKey: string;
  readonly getAccessToken?: () => Promise<string | null> | string | null;
  readonly fetchFn?: typeof fetch;
}

export interface SearchTitlesParams {
  readonly query: string;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface GetTitleDetailsParams {
  readonly id: string;
  readonly signal?: AbortSignal;
}

export interface ListWatchlistParams {
  readonly signal?: AbortSignal;
}

export interface AddWatchlistItemParams extends AddWatchlistItemInput {
  readonly signal?: AbortSignal;
}

export interface RemoveWatchlistItemParams extends RemoveWatchlistItemInput {
  readonly signal?: AbortSignal;
}

export interface ReleaseRadarApiClient {
  health(): Promise<HealthStatus>;
  searchTitles(params: SearchTitlesParams): Promise<TitleSearchResult>;
  getTitleDetails(params: GetTitleDetailsParams): Promise<TitleDetails>;
  listWatchlist(params?: ListWatchlistParams): Promise<WatchlistListResult>;
  addWatchlistItem(
    params: AddWatchlistItemParams,
  ): Promise<WatchlistUpsertResult>;
  removeWatchlistItem(params: RemoveWatchlistItemParams): Promise<void>;
}

export function createReleaseRadarApiClient(
  options: ReleaseRadarApiClientOptions,
): ReleaseRadarApiClient {
  const fetchFn = options.fetchFn ?? fetch;

  return {
    async health() {
      throw new Error("API endpoints are not scaffolded yet.");
    },
    async searchTitles({ query, limit, signal }) {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) {
        return { query: "", results: [] };
      }

      const searchParams = new URLSearchParams({ query: normalizedQuery });
      if (limit) {
        searchParams.set("limit", String(limit));
      }

      const accessToken = await resolveAccessToken(
        options.publishableKey,
        options.getAccessToken,
      );

      const response = await fetchFn(
        `${options.baseUrl}${API_PATH_PREFIX}/titles?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            apikey: options.publishableKey,
            Authorization: `Bearer ${accessToken}`,
          },
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Search request failed (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!isTitleSearchResult(payload)) {
        throw new Error("Search response payload is invalid.");
      }

      return payload;
    },
    async getTitleDetails({ id, signal }) {
      const normalizedId = id.trim();
      if (!normalizedId) {
        throw new Error("Title id is required.");
      }

      const accessToken = await resolveAccessToken(
        options.publishableKey,
        options.getAccessToken,
      );

      const response = await fetchFn(
        `${options.baseUrl}${API_PATH_PREFIX}/titles/${encodeURIComponent(normalizedId)}`,
        {
          method: "GET",
          headers: {
            apikey: options.publishableKey,
            Authorization: `Bearer ${accessToken}`,
          },
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Title details request failed (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!isTitleDetails(payload)) {
        throw new Error("Title details payload is invalid.");
      }

      return payload;
    },
    async listWatchlist({ signal }: ListWatchlistParams = {}) {
      const accessToken = await resolveAccessToken(
        options.publishableKey,
        options.getAccessToken,
      );

      const response = await fetchFn(
        `${options.baseUrl}${API_PATH_PREFIX}/watchlist`,
        {
          method: "GET",
          headers: {
            apikey: options.publishableKey,
            Authorization: `Bearer ${accessToken}`,
          },
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Watchlist request failed (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!isWatchlistListResult(payload)) {
        throw new Error("Watchlist payload is invalid.");
      }

      return payload;
    },
    async addWatchlistItem({ titleId, signal }) {
      const normalizedTitleId = titleId.trim();
      if (!normalizedTitleId) {
        throw new Error("titleId is required.");
      }

      const accessToken = await resolveAccessToken(
        options.publishableKey,
        options.getAccessToken,
      );

      const response = await fetchFn(
        `${options.baseUrl}${API_PATH_PREFIX}/watchlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: options.publishableKey,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ titleId: normalizedTitleId }),
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Add watchlist request failed (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!isWatchlistUpsertResult(payload)) {
        throw new Error("Watchlist add payload is invalid.");
      }

      return payload;
    },
    async removeWatchlistItem({ titleId, signal }) {
      const normalizedTitleId = titleId.trim();
      if (!normalizedTitleId) {
        throw new Error("titleId is required.");
      }

      const accessToken = await resolveAccessToken(
        options.publishableKey,
        options.getAccessToken,
      );

      const response = await fetchFn(
        `${options.baseUrl}${API_PATH_PREFIX}/watchlist/${encodeURIComponent(normalizedTitleId)}`,
        {
          method: "DELETE",
          headers: {
            apikey: options.publishableKey,
            Authorization: `Bearer ${accessToken}`,
          },
          signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Remove watchlist request failed (${response.status}).`,
        );
      }
    },
  };
}

async function resolveAccessToken(
  fallbackToken: string,
  getAccessToken: ReleaseRadarApiClientOptions["getAccessToken"],
) {
  if (!getAccessToken) {
    return fallbackToken;
  }

  const token = await getAccessToken();
  return token ?? fallbackToken;
}

function isTitleSearchResult(value: unknown): value is TitleSearchResult {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.query === "string" && Array.isArray(value.results);
}

function isTitleDetails(value: unknown): value is TitleDetails {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.platforms) &&
    Array.isArray(value.releases)
  );
}

function isWatchlistListResult(value: unknown): value is WatchlistListResult {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value.items)) {
    return false;
  }

  return value.items.every(isWatchlistItem);
}

function isWatchlistUpsertResult(
  value: unknown,
): value is WatchlistUpsertResult {
  if (!isRecord(value)) {
    return false;
  }

  return isWatchlistItem(value.item);
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.addedAt === "string" &&
    isTitleSummary(value.title) &&
    Array.isArray(value.releases)
  );
}

function isTitleSummary(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.platforms)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
