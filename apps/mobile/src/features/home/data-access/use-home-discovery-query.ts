import { useQuery } from "@tanstack/react-query";

import { apiClient, apiClientConfigError } from "@/lib/api-client";

export function useHomeDiscoveryQuery() {
  return useQuery({
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
