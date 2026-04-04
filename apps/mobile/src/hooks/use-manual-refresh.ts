import { useCallback, useEffect, useState } from "react";

type UseManualRefreshParams = {
  enabled: boolean;
  hasData: boolean;
  isOffline: boolean;
  refreshAction: () => Promise<unknown>;
};

export function useManualRefresh({
  enabled,
  hasData,
  isOffline,
  refreshAction,
}: UseManualRefreshParams) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isOffline || !isRefreshing) {
      return;
    }

    setIsRefreshing(false);
  }, [isOffline, isRefreshing]);

  const refresh = useCallback(async () => {
    if (!enabled || isOffline || isRefreshing) {
      return;
    }

    if (!hasData) {
      await refreshAction();
      return;
    }

    setIsRefreshing(true);
    try {
      await refreshAction();
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, hasData, isOffline, isRefreshing, refreshAction]);

  return {
    isRefreshing,
    canRefresh: enabled && !isOffline,
    refresh,
  };
}
