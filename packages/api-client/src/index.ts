import { API_PATH_PREFIX } from "@repo/config";
import type { HealthStatus } from "@repo/types";
import type { TitleDetails } from "@repo/types";
import type { TitleSearchResult } from "@repo/types";
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

export interface ReleaseRadarApiClient {
  health(): Promise<HealthStatus>;
  searchTitles(params: SearchTitlesParams): Promise<TitleSearchResult>;
  getTitleDetails(params: GetTitleDetailsParams): Promise<TitleDetails>;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
