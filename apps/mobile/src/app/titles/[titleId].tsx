import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HeaderIconButton } from "@/components/header-icon-button";
import { useTitleDetailsQuery } from "@/features/title-details/data-access/queries/use-title-details-query";
import { TitleDetailsStateView } from "@/features/title-details/components";
import { useTheme } from "@/hooks/use-theme";
import { useTitleWatchlist } from "@/features/watchlist/hooks/use-title-watchlist";

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

  const { isInWatchlist, canToggleWatchlist, isMutating, toggleWatchlist } =
    useTitleWatchlist(titleId, titleDetails);
  const isBookmarkActive = isInWatchlist;
  const bookmarkTintColor = isBookmarkActive
    ? theme.accent.watchlist
    : theme.textSecondary;
  const bookmarkAccessibilityLabel = isBookmarkActive
    ? "Remove from watchlist"
    : "Add to watchlist";
  const toolbarIcon = isBookmarkActive ? "bookmark.fill" : "bookmark";

  return (
    <>
      <Stack.Screen
        options={{
          title: titleDetails?.name?.trim() || headerTitle,
          headerLargeTitleEnabled: false,
          headerRight:
            Platform.OS !== "ios"
              ? undefined
              : () => (
                  <HeaderIconButton
                    onPress={toggleWatchlist}
                    accessibilityLabel={bookmarkAccessibilityLabel}
                    tintColor={bookmarkTintColor}
                    iconProps={
                      isBookmarkActive
                        ? {
                            ios: "bookmark.fill",
                            android: "bookmark",
                          }
                        : {
                            ios: "bookmark",
                            android: "bookmark_add",
                          }
                    }
                    disabled={isMutating || !canToggleWatchlist}
                  />
                ),
        }}
      />

      {Platform.OS === "ios" ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            tintColor={bookmarkTintColor}
            icon={toolbarIcon}
            onPress={toggleWatchlist}
            accessibilityLabel={bookmarkAccessibilityLabel}
            hidden={!canToggleWatchlist && isMutating}
          />
        </Stack.Toolbar>
      ) : null}

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
