import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

type SearchScreenRouteParams = {
  query?: string | string[];
};

export type SearchBarCommands = {
  setText: (text: string) => void;
  clearText: () => void;
  focus: () => void;
  blur: () => void;
  toggleCancelButton: (flag: boolean) => void;
  cancelSearch: () => void;
};

export function useSearchRouteQuery() {
  const searchBarRef = useRef<SearchBarCommands | null>(null);
  const { query: rawQuery } = useLocalSearchParams<SearchScreenRouteParams>();
  const routeQuery = normalizeRouteParam(rawQuery);
  const [query, setQuery] = useState(routeQuery);

  useEffect(() => {
    setQuery(routeQuery);

    if (routeQuery.length > 0) {
      searchBarRef.current?.setText(routeQuery);
      return;
    }

    searchBarRef.current?.clearText();
  }, [routeQuery]);

  return {
    query,
    setQuery,
    searchBarRef,
  };
}

function normalizeRouteParam(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return (value[0] ?? "").trim();
  }

  return "";
}
