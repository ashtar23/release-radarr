import type { HealthStatus } from "@repo/types";

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
