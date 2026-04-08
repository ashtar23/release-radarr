import { useQuery } from "@tanstack/react-query";
import type { HomeDiscoveryResponse } from "@repo/api-client";

import { apiClient, apiClientConfigError } from "@/lib/api-client";

export function useHomeDiscoveryQuery() {
  return useQuery<HomeDiscoveryResponse>({
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
