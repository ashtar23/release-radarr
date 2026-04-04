import { useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function useWatchlistSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, {
    delayMs: 500,
  }).trim();

  return {
    searchQuery,
    setSearchQuery,
    trimmedSearchQuery: searchQuery.trim(),
    debouncedSearchQuery,
  };
}
