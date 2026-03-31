import { useCallback } from "react";

import { usePersistedSettingsState } from "@/features/settings/hooks/use-persisted-settings-state";

const STORAGE_KEY = "release-radarr:search:recent-searches:v1";
const MAX_STORED_RECENT_SEARCHES = 8;
const MAX_VISIBLE_RECENT_SEARCHES = 5;

export function useRecentSearches() {
  const { value, updateValue } = usePersistedSettingsState<string[]>({
    storageKey: STORAGE_KEY,
    defaultValue: [],
    parseStoredValue: parseStoredRecentSearches,
  });

  const recordRecentSearch = useCallback((query: string) => {
    const normalizedQuery = normalizeRecentSearch(query);
    if (normalizedQuery.length < 2) {
      return;
    }

    updateValue((current) => {
      const nextValue = [
        query.trim(),
        ...current.filter(
          (item) => normalizeRecentSearch(item) !== normalizedQuery,
        ),
      ].slice(0, MAX_STORED_RECENT_SEARCHES);

      return arraysEqual(current, nextValue) ? current : nextValue;
    });
  }, [updateValue]);

  const removeRecentSearch = useCallback((query: string) => {
    const normalizedQuery = normalizeRecentSearch(query);

    updateValue((current) => {
      const nextValue = current.filter(
        (item) => normalizeRecentSearch(item) !== normalizedQuery,
      );

      return arraysEqual(current, nextValue) ? current : nextValue;
    });
  }, [updateValue]);

  const clearRecentSearches = useCallback(() => {
    updateValue((current) => (current.length === 0 ? current : []));
  }, [updateValue]);

  return {
    recentSearches: value.slice(0, MAX_VISIBLE_RECENT_SEARCHES),
    recordRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

function parseStoredRecentSearches(rawValue: string) {
  try {
    const value = JSON.parse(rawValue);
    if (!Array.isArray(value)) {
      return null;
    }

    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, MAX_STORED_RECENT_SEARCHES);
  } catch {
    return null;
  }
}

function normalizeRecentSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
