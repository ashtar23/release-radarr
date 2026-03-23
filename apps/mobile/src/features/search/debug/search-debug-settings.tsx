import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

const STORAGE_KEY = "release-radarr:search-debug-settings:v1";

const DEFAULT_SETTINGS = {
  forceRawgRefresh: false,
  showSourceBadge: true,
};
type SearchDebugSettings = typeof DEFAULT_SETTINGS;
type SettingsUpdater = (current: SearchDebugSettings) => SearchDebugSettings;

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
  const [settings, setSettings] = useState<SearchDebugSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(!SEARCH_DEBUG_MODE_ENABLED);

  useEffect(() => {
    if (!SEARCH_DEBUG_MODE_ENABLED) {
      setIsHydrated(true);
      return;
    }

    const abortController = new AbortController();
    const hydrateSettings = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (abortController.signal.aborted || !rawValue) {
          return;
        }

        const parsed = parseStoredSettings(rawValue);
        if (parsed) {
          setSettings(parsed);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsHydrated(true);
        }
      }
    };
    void hydrateSettings();

    return () => {
      abortController.abort();
    };
  }, []);

  const persistSettings = useCallback((nextSettings: SearchDebugSettings) => {
    if (!SEARCH_DEBUG_MODE_ENABLED || !isHydrated) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  }, [isHydrated]);

  const updateSettings = useCallback((updater: SettingsUpdater) => {
    if (!SEARCH_DEBUG_MODE_ENABLED) {
      return;
    }

    setSettings((current) => {
      const nextSettings = updater(current);
      persistSettings(nextSettings);
      return nextSettings;
    });
  }, [persistSettings]);

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
      resetSearchDebugSettings: () => {
        updateSettings(() => DEFAULT_SETTINGS);
      },
    };
  }, [isHydrated, settings, updateSettings]);

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
