import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { usePersistedSettingsState } from "@/features/settings/hooks/use-persisted-settings-state";

const STORAGE_KEY = "release-radarr:search-debug-settings:v1";

const DEFAULT_SETTINGS = {
  forceRawgRefresh: false,
  showSourceBadge: true,
};
type SearchDebugSettings = typeof DEFAULT_SETTINGS;

export const SEARCH_DEBUG_MODE_ENABLED =
  __DEV__ || process.env.EXPO_PUBLIC_SEARCH_DEBUG === "1";

interface SearchDebugSettingsContextValue {
  isDebugModeEnabled: boolean;
  isHydrated: boolean;
  forceRawgRefresh: boolean;
  showSourceBadge: boolean;
  setForceRawgRefresh: (value: boolean) => void;
  setShowSourceBadge: (value: boolean) => void;
  resetSearchDebugSettings: () => void;
}

const SearchDebugSettingsContext =
  createContext<SearchDebugSettingsContextValue | null>(null);

export function SearchDebugSettingsProvider({ children }: PropsWithChildren) {
  const { value: settings, isHydrated, updateValue: updateSettings, resetValue } =
    usePersistedSettingsState<SearchDebugSettings>({
      storageKey: STORAGE_KEY,
      defaultValue: DEFAULT_SETTINGS,
      parseStoredValue: parseStoredSettings,
      enabled: SEARCH_DEBUG_MODE_ENABLED,
    });

  const value = useMemo<SearchDebugSettingsContextValue>(() => {
    const forceRawgRefresh = SEARCH_DEBUG_MODE_ENABLED
      ? settings.forceRawgRefresh
      : false;
    const showSourceBadge = SEARCH_DEBUG_MODE_ENABLED
      ? settings.showSourceBadge
      : false;

    return {
      isDebugModeEnabled: SEARCH_DEBUG_MODE_ENABLED,
      isHydrated,
      forceRawgRefresh,
      showSourceBadge,
      setForceRawgRefresh: (nextValue) => {
        updateSettings((current) => ({ ...current, forceRawgRefresh: nextValue }));
      },
      setShowSourceBadge: (nextValue) => {
        updateSettings((current) => ({ ...current, showSourceBadge: nextValue }));
      },
      resetSearchDebugSettings: resetValue,
    };
  }, [isHydrated, resetValue, settings, updateSettings]);

  return (
    <SearchDebugSettingsContext.Provider value={value}>
      {children}
    </SearchDebugSettingsContext.Provider>
  );
}

export function useSearchDebugSettings() {
  const value = useContext(SearchDebugSettingsContext);
  if (!value) {
    throw new Error(
      "useSearchDebugSettings must be used within SearchDebugSettingsProvider.",
    );
  }

  return value;
}

function parseStoredSettings(rawValue: string) {
  try {
    const value = JSON.parse(rawValue) as Record<string, unknown>;
    return {
      forceRawgRefresh: value.forceRawgRefresh === true,
      showSourceBadge:
        value.showSourceBadge === undefined || value.showSourceBadge === true,
    };
  } catch {
    return null;
  }
}
