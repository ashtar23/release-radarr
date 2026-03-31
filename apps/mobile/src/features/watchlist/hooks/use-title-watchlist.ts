import { router } from "expo-router";
import type { TitleDetails } from "@repo/types";

import { useAppHaptics } from "@/features/settings/hooks/use-app-haptics";
import { useWatchlistFeature } from "./use-watchlist-feature";

export function useTitleWatchlist(
  titleId: string,
  titleDetails?: TitleDetails,
) {
  const haptics = useAppHaptics();
  const watchlistFeature = useWatchlistFeature();
  const isInWatchlist = watchlistFeature.isInWatchlist(titleId);
  const canToggleWatchlist = isInWatchlist || Boolean(titleDetails);

  const toggleWatchlist = () => {
    if (!watchlistFeature.canUseWatchlist) {
      router.push("/auth");
      return;
    }

    haptics.impact();

    if (isInWatchlist) {
      watchlistFeature.removeFromWatchlist(titleId);
      return;
    }

    if (titleDetails) {
      watchlistFeature.addToWatchlist(titleDetails);
    }
  };

  return {
    isInWatchlist,
    canToggleWatchlist,
    isMutating: watchlistFeature.isMutating,
    toggleWatchlist,
  };
}
