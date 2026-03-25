import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

import { HeaderIconButton } from "@/components/header-icon-button";
import { useTitleDetailsQuery } from "@/features/title-details/data-access/queries/use-title-details-query";
import { TitleDetailsStateView } from "@/features/title-details/components";
import { useTheme } from "@/hooks/use-theme";
import { useWatchlistMutation } from "@/features/watchlist/queries/use-watchlist-mutation";
import { useIsTitleInWatchlist } from "@/features/watchlist/queries/use-is-title-in-watchlist";

type TitleDetailsScreenProps = {
  titleId?: string | string[];
  titleName?: string | string[];
};

export default function TitleDetailsScreen() {
  const { titleId: rawTitleId, titleName: rawTitleName } =
    useLocalSearchParams<TitleDetailsScreenProps>();

  const titleId = normalizeRouteParam(rawTitleId);
  const initialTitle = normalizeRouteParam(rawTitleName);
  const headerTitle = detailsQueryNamePlaceholder(initialTitle);
  const theme = useTheme();

  const {
    data: titleDetails,
    isPending,
    isError,
    error,
  } = useTitleDetailsQuery({ titleId });

  const { addMutation, removeMutation } = useWatchlistMutation();
  const { isInWatchlist } = useIsTitleInWatchlist(titleId);
  const isMutationInFlight = addMutation.isPending || removeMutation.isPending;
  const isBookmarkActive = isInWatchlist;
  const canToggleWatchlist = isBookmarkActive || Boolean(titleDetails);
  const bookmarkTintColor = isBookmarkActive
    ? theme.accent.watchlist
    : theme.textSecondary;
  const bookmarkAccessibilityLabel = isBookmarkActive
    ? "Remove from watchlist"
    : "Add to watchlist";

  return (
    <>
      <Stack.Screen
        options={{
          title: titleDetails?.name?.trim() || headerTitle,
          headerLargeTitleEnabled: false,
          headerRight: () => (
            <HeaderIconButton
              onPress={() => {
                if (isBookmarkActive) {
                  removeMutation.mutate({ titleId });
                  return;
                }

                if (titleDetails) {
                  addMutation.mutate({ title: titleDetails });
                }
              }}
              accessibilityLabel={bookmarkAccessibilityLabel}
              tintColor={bookmarkTintColor}
              iconProps={
                isBookmarkActive
                  ? ({ ios: "bookmark.fill", android: "bookmark" } as const)
                  : ({ ios: "bookmark", android: "bookmark_add" } as const)
              }
              disabled={isMutationInFlight || !canToggleWatchlist}
            />
          ),
        }}
      />

      <TitleDetailsStateView
        titleId={titleId}
        error={error}
        isError={isError}
        isPending={isPending}
        titleDetails={titleDetails}
      />
    </>
  );
}

export function normalizeRouteParam(
  value: string | string[] | undefined,
): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) return (value[0] ?? "").trim();

  return "";
}

function detailsQueryNamePlaceholder(initialTitle: string) {
  return initialTitle.length > 0 ? initialTitle : "Title";
}
