import { useMemo } from "react";

import { type HeaderAction } from "@/features/navigation/header-actions";
import { useTheme } from "@/hooks/use-theme";
import { useTitleWatchlist } from "@/features/watchlist/hooks/use-title-watchlist";

import { titleDetailsConfigError } from "../data-access/get-title-details";
import { useTitleDetailsQuery } from "../queries/use-title-details-query";
import {
  deriveTitleDetailsScreenState,
  type TitleDetailsScreenReadyState,
} from "../screen-state";
import { toDetailErrorMessage } from "../utils/title-details-format";

type UseTitleDetailsScreenParams = {
  titleId: string;
  initialTitle: string;
};

export function useTitleDetailsScreen({
  titleId,
  initialTitle,
}: UseTitleDetailsScreenParams) {
  const theme = useTheme();
  const headerTitle = initialTitle.length > 0 ? initialTitle : "Title";
  const { data, error, isError, isPending, isRefetching, refetch } =
    useTitleDetailsQuery({ titleId });
  const details = data?.details;
  const screenTitle = details?.name?.trim() || headerTitle;

  const { isInWatchlist, canToggleWatchlist, isMutating, toggleWatchlist } =
    useTitleWatchlist(titleId, details, data?.isInWatchlist);

  const isBookmarkActive = isInWatchlist;
  const bookmarkTintColor = isBookmarkActive
    ? theme.accent.watchlist
    : theme.textSecondary;
  const bookmarkAccessibilityLabel = isBookmarkActive
    ? "Remove from watchlist"
    : "Add to watchlist";

  const headerActions = useMemo<HeaderAction[]>(
    () =>
      details
        ? [
            {
              kind: "button",
              id: "title-watchlist",
              label: bookmarkAccessibilityLabel,
              iosIcon: isBookmarkActive ? "bookmark.fill" : "bookmark",
              androidIcon: isBookmarkActive ? "bookmark" : "bookmark_add",
              tintColor: bookmarkTintColor,
              onPress: toggleWatchlist,
              disabled: isMutating || !canToggleWatchlist,
            },
          ]
        : [],
    [
      bookmarkAccessibilityLabel,
      bookmarkTintColor,
      canToggleWatchlist,
      details,
      isBookmarkActive,
      isMutating,
      toggleWatchlist,
    ],
  );

  const readyState: TitleDetailsScreenReadyState | null = details
    ? {
        mode: "ready",
        details,
      }
    : null;

  const state = deriveTitleDetailsScreenState({
    configError: titleDetailsConfigError,
    titleId,
    isInitialLoading: isPending,
    hasBlockingRequestError: isError,
    requestErrorMessage: readyState
      ? toDetailErrorMessage(error)
      : toDetailErrorMessage(error) || "Title details were unavailable.",
    onRetry: () => {
      void refetch();
    },
    retrying: isRefetching,
    readyState,
  });

  const retry = () => {
    void refetch();
  };

  return {
    headerActions,
    screenTitle,
    state,
    retry,
    retrying: isRefetching,
  };
}
