import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import type { TitleDetails } from "@repo/types";

import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { useWatchlistFeature } from "./use-watchlist-feature";

export function useTitleWatchlist(
  titleId: string,
  titleDetails?: TitleDetails,
) {
  const { hapticsEnabled } = useAppPreferences();
  const watchlistFeature = useWatchlistFeature();
  const isInWatchlist = watchlistFeature.isInWatchlist(titleId);
  const canToggleWatchlist = isInWatchlist || Boolean(titleDetails);

  const triggerHapticFeedback = () => {
    if (!hapticsEnabled) {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {},
    );
  };

  const toggleWatchlist = () => {
    if (!watchlistFeature.canUseWatchlist) {
      router.push("/auth");
      return;
    }

    triggerHapticFeedback();

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
