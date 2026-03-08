import { useEffect, useState } from "react";

interface UseDebouncedValueOptions {
  delayMs?: number;
}

export function useDebouncedValue(
  value: string,
  options?: UseDebouncedValueOptions,
) {
  const delayMs = options?.delayMs ?? 350;
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutMs = value.trim().length ? delayMs : 0;
    const timeout = setTimeout(() => {
      setDebouncedValue(value.trim().length ? value : "");
    }, timeoutMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}
