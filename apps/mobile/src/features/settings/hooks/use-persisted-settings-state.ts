import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

type StoredValueParser<T> = (rawValue: string) => T | null;
type SettingsUpdater<T> = (current: T) => T;

type UsePersistedSettingsStateOptions<T> = {
  storageKey: string;
  defaultValue: T;
  parseStoredValue: StoredValueParser<T>;
  enabled?: boolean;
};

export function usePersistedSettingsState<T>({
  storageKey,
  defaultValue,
  parseStoredValue,
  enabled = true,
}: UsePersistedSettingsStateOptions<T>) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setValue(defaultValue);
      setIsHydrated(true);
      return;
    }

    const abortController = new AbortController();

    const hydrateValue = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(storageKey);
        if (abortController.signal.aborted || !rawValue) {
          return;
        }

        const parsed = parseStoredValue(rawValue);
        if (parsed !== null) {
          setValue(parsed);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsHydrated(true);
        }
      }
    };

    setValue(defaultValue);
    setIsHydrated(false);
    void hydrateValue();

    return () => {
      abortController.abort();
    };
  }, [defaultValue, enabled, parseStoredValue, storageKey]);

  const persistValue = useCallback(
    (nextValue: T) => {
      if (!enabled || !isHydrated) {
        return;
      }

      void AsyncStorage.setItem(storageKey, JSON.stringify(nextValue));
    },
    [enabled, isHydrated, storageKey],
  );

  const updateValue = useCallback(
    (updater: SettingsUpdater<T>) => {
      if (!enabled) {
        return;
      }

      setValue((current) => {
        const nextValue = updater(current);
        persistValue(nextValue);
        return nextValue;
      });
    },
    [enabled, persistValue],
  );

  const resetValue = useCallback(() => {
    updateValue(() => defaultValue);
  }, [defaultValue, updateValue]);

  return {
    value,
    isHydrated,
    updateValue,
    resetValue,
  };
}
