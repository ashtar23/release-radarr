import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useTitleDetailsQuery } from "@/features/title-details/data-access/queries/use-title-details-query";
import {
  TitleDetailsContent,
  TitleDetailsStateView,
} from "@/features/title-details/components";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { useTheme } from "@/hooks/use-theme";
import { useTitleWatchlist } from "@/features/watchlist/hooks/use-title-watchlist";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { titleDetailsConfigError } from "@/features/title-details/data-access/get-title-details";
import { toDetailErrorMessage } from "@/features/title-details/utils/title-details-format";

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
    refetch,
    isRefetching,
  } = useTitleDetailsQuery({ titleId });
  const handleRetry = () => {
    void refetch();
  };
  const screenTitle = titleDetails?.name?.trim() || headerTitle;

  const { isInWatchlist, canToggleWatchlist, isMutating, toggleWatchlist } =
    useTitleWatchlist(titleId, titleDetails);

  const isBookmarkActive = isInWatchlist;

  const bookmarkTintColor = isBookmarkActive
    ? theme.accent.watchlist
    : theme.textSecondary;

  const bookmarkAccessibilityLabel = isBookmarkActive
    ? "Remove from watchlist"
    : "Add to watchlist";

  const headerActions = useMemo<HeaderAction[]>(
    () => [
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
    ],
    [
      bookmarkAccessibilityLabel,
      bookmarkTintColor,
      canToggleWatchlist,
      isBookmarkActive,
      isMutating,
      toggleWatchlist,
    ],
  );

  const stateView = getTitleDetailsStateView({
    error,
    hasTitleDetails: titleDetails != null,
    isError,
    isPending,
    onRetry: handleRetry,
    retrying: isRefetching,
    titleDetailsConfigError,
    titleId,
  });
  const isSuccess = stateView === null && titleDetails != null;

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLargeTitleEnabled: false,
        }}
      />

      {isSuccess ? <HeaderActions actions={headerActions} /> : null}

      {isSuccess ? (
        <ScreenScrollView contentContainerStyle={styles.content}>
          <TitleDetailsContent details={titleDetails} />
        </ScreenScrollView>
      ) : (
        stateView
      )}
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

type TitleDetailsStateSelection = {
  error: unknown;
  hasTitleDetails: boolean;
  isError: boolean;
  isPending: boolean;
  onRetry: () => void;
  retrying: boolean;
  titleDetailsConfigError: string | null;
  titleId: string;
};

function getTitleDetailsStateView({
  error,
  hasTitleDetails,
  isError,
  isPending,
  onRetry,
  retrying,
  titleDetailsConfigError,
  titleId,
}: TitleDetailsStateSelection): React.ReactNode | null {
  if (titleDetailsConfigError) {
    return (
      <TitleDetailsStateView
        mode="config-error"
        errorMessage={titleDetailsConfigError}
      />
    );
  }

  if (titleId.length === 0) {
    return <TitleDetailsStateView mode="invalid-title" />;
  }

  if (isPending) {
    return <TitleDetailsStateView mode="loading" />;
  }

  if (isError) {
    return (
      <TitleDetailsStateView
        mode="request-error"
        errorMessage={toDetailErrorMessage(error)}
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }

  if (!hasTitleDetails) {
    return (
      <TitleDetailsStateView
        mode="request-error"
        errorMessage="Title details were unavailable."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
});
