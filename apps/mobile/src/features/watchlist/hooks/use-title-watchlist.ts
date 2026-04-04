import { router } from "expo-router";
import type { TitleDetails } from "@repo/types";
import { useCallback } from "react";

import { useAuthGate } from "@/auth/use-auth-gate";
import { useAppHaptics } from "@/features/settings/hooks/use-app-haptics";
import { useIsOffline } from "@/lib/react-query-online";

import { useWatchlistMutation } from "../mutations/use-watchlist-mutation";
import { useWatchlistMembershipQuery } from "../queries/use-watchlist-query";

export function useTitleWatchlist(
  titleId: string,
  titleDetails?: TitleDetails,
) {
  const { isSignedIn } = useAuthGate();
  const haptics = useAppHaptics();
  const isOffline = useIsOffline();
  const { data: membershipData } = useWatchlistMembershipQuery(titleId);
  const { addMutation, removeMutation } = useWatchlistMutation();
  const isInWatchlist = membershipData?.isInWatchlist ?? false;
  const canToggleWatchlist =
    !isOffline && (isInWatchlist || Boolean(titleDetails));

  const toggleWatchlist = useCallback(() => {
    if (isOffline) {
      return;
    }

    if (!isSignedIn) {
      router.push("/auth");
      return;
    }

    haptics.impact();

    if (isInWatchlist) {
      removeMutation.mutate({ titleId });
      return;
    }

    if (titleDetails) {
      addMutation.mutate({ title: titleDetails });
    }
  }, [
    addMutation,
    haptics,
    isInWatchlist,
    isOffline,
    isSignedIn,
    removeMutation,
    titleDetails,
    titleId,
  ]);

  return {
    isInWatchlist,
    canToggleWatchlist,
    isMutating: addMutation.isPending || removeMutation.isPending,
    toggleWatchlist,
  };
}
