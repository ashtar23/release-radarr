import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function useWatchlistSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery).trim();

  return {
    searchQuery,
    setSearchQuery,
    trimmedSearchQuery: searchQuery.trim(),
    debouncedSearchQuery,
  };
}
