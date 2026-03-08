import type { HealthStatus } from "@repo/types";
export {
  initializeSupabaseClient,
  type InitializedSupabaseClient,
  type InitializeSupabaseClientOptions,
} from "./supabase-client";

export interface ReleaseRadarApiClientOptions {
  readonly baseUrl: string;
}

export interface ReleaseRadarApiClient {
  health(): Promise<HealthStatus>;
}

export function createReleaseRadarApiClient(
  options: ReleaseRadarApiClientOptions,
): ReleaseRadarApiClient {
  void options;
  return {
    async health() {
      throw new Error("API endpoints are not scaffolded yet.");
    },
  };
}
