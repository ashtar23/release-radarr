import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const latestValueRef = useRef(defaultValue);
  const pendingPersistedValueRef = useRef<T | null>(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled) {
      setValue(defaultValue);
      setIsHydrated(true);
      latestValueRef.current = defaultValue;
      pendingPersistedValueRef.current = null;
      return;
    }

    const abortController = new AbortController();

    const hydrateValue = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(storageKey);
        if (abortController.signal.aborted || !rawValue) {
          return;
        }

        if (pendingPersistedValueRef.current !== null) {
          return;
        }

        const parsed = parseStoredValue(rawValue);
        if (parsed !== null) {
          setValue(parsed);
          latestValueRef.current = parsed;
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsHydrated(true);

          const pendingValue = pendingPersistedValueRef.current;
          if (pendingValue !== null) {
            latestValueRef.current = pendingValue;
            pendingPersistedValueRef.current = null;
            void AsyncStorage.setItem(storageKey, JSON.stringify(pendingValue));
          }
        }
      }
    };

    const hasPendingValue = pendingPersistedValueRef.current !== null;
    if (!hasPendingValue) {
      setValue(defaultValue);
      latestValueRef.current = defaultValue;
    }
    setIsHydrated(false);
    void hydrateValue();

    return () => {
      abortController.abort();
    };
  }, [defaultValue, enabled, parseStoredValue, storageKey]);

  const persistValue = useCallback(
    (nextValue: T) => {
      if (!enabled) {
        return;
      }

      if (!isHydrated) {
        pendingPersistedValueRef.current = nextValue;
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
