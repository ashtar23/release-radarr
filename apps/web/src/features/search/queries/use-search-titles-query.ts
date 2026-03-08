import { useQuery } from "@tanstack/react-query";

import {
  searchTitles,
  searchTitlesConfigError,
} from "../data-access/search-titles";

export const MIN_QUERY_LENGTH = 2;

export function useSearchTitlesQuery(debouncedQuery: string) {
  return useQuery({
    queryKey: ["titles", "search", debouncedQuery],
    enabled:
      debouncedQuery.length >= MIN_QUERY_LENGTH &&
      searchTitlesConfigError === null,
    queryFn: ({ signal }) => searchTitles({ query: debouncedQuery, signal }),
  });
}
