import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { usePersistedSettingsState } from "@/features/settings/hooks/use-persisted-settings-state";

const STORAGE_KEY = "release-radarr:app-preferences:v1";

const DEFAULT_PREFERENCES = {
  hapticsEnabled: true,
};

type AppPreferences = typeof DEFAULT_PREFERENCES;

type AppPreferencesContextValue = {
  isHydrated: boolean;
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => void;
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
    }),
    [isHydrated, preferences.hapticsEnabled, updatePreferences],
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
    return {
      hapticsEnabled:
        value.hapticsEnabled === undefined || value.hapticsEnabled === true,
    };
  } catch {
    return null;
  }
}
