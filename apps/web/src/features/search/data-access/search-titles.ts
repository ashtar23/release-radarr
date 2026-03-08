import { apiClient, apiClientConfigError } from "@/lib/api-client";

interface SearchTitlesParams {
  query: string;
  signal?: AbortSignal;
}

export const searchTitlesConfigError = apiClientConfigError;

export function searchTitles({ query, signal }: SearchTitlesParams) {
  if (!apiClient) {
    throw new Error(searchTitlesConfigError ?? "Search API is not configured.");
  }

  return apiClient.searchTitles({ query, signal });
}
