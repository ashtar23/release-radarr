import { useQuery } from "@tanstack/react-query";
import type { HomeDiscoveryResult, TitleSummary } from "@repo/types";

import { apiClient, apiClientConfigError } from "@/lib/api-client";

export function useHomeDiscoveryQuery() {
  return useQuery<HomeDiscoveryResult<TitleSummary>>({
    queryKey: ["home", "discovery"],
    enabled: Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Home discovery API is not configured.",
        );
      }

      return apiClient.getHomeDiscovery({ signal });
    },
  });
}
