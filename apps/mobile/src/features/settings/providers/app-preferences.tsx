import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { watchlistSortValues, type WatchlistSort } from "@repo/types";
import { usePersistedSettingsState } from "@/features/settings/hooks/use-persisted-settings-state";
import { DEFAULT_WATCHLIST_SORT } from "@/features/watchlist/watchlist-sort";

const STORAGE_KEY = "release-radarr:app-preferences:v1";

const DEFAULT_PREFERENCES = {
  hapticsEnabled: true,
  defaultWatchlistSort: DEFAULT_WATCHLIST_SORT,
};

type AppPreferences = typeof DEFAULT_PREFERENCES;

type AppPreferencesContextValue = {
  isHydrated: boolean;
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
  defaultWatchlistSort: WatchlistSort;
  setDefaultWatchlistSort: (value: WatchlistSort) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null,
);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const { value: preferences, isHydrated, updateValue: updatePreferences } =
    usePersistedSettingsState<AppPreferences>({
      storageKey: STORAGE_KEY,
      defaultValue: DEFAULT_PREFERENCES,
      parseStoredValue: parseStoredPreferences,
    });

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      isHydrated,
      hapticsEnabled: preferences.hapticsEnabled,
      setHapticsEnabled: (nextValue) => {
        updatePreferences((current) => ({
          ...current,
          hapticsEnabled: nextValue,
        }));
      },
      defaultWatchlistSort: preferences.defaultWatchlistSort,
      setDefaultWatchlistSort: (nextValue) => {
        updatePreferences((current) => ({
          ...current,
          defaultWatchlistSort: nextValue,
        }));
      },
    }),
    [
      isHydrated,
      preferences.defaultWatchlistSort,
      preferences.hapticsEnabled,
      updatePreferences,
    ],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const value = useContext(AppPreferencesContext);
  if (!value) {
    throw new Error(
      "useAppPreferences must be used within AppPreferencesProvider.",
    );
  }

  return value;
}

function parseStoredPreferences(rawValue: string) {
  try {
    const value = JSON.parse(rawValue) as Record<string, unknown>;
    const defaultWatchlistSort = watchlistSortValues.includes(
      value.defaultWatchlistSort as WatchlistSort,
    )
      ? (value.defaultWatchlistSort as WatchlistSort)
      : DEFAULT_WATCHLIST_SORT;

    return {
      hapticsEnabled:
        value.hapticsEnabled === undefined || value.hapticsEnabled === true,
      defaultWatchlistSort,
    };
  } catch {
    return null;
  }
}
