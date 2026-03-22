import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

import { HeaderIconButton } from "@/components/header-icon-button";
import { useTitleDetailsQuery } from "@/features/title-details/data-access/queries/use-title-details-query";
import { TitleDetailsStateView } from "@/features/title-details/components";

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

  const {
    data: titleDetails,
    isPending,
    isError,
    error,
  } = useTitleDetailsQuery({ titleId });

  return (
    <>
      <Stack.Screen
        options={{
          title: titleDetails?.name?.trim() || headerTitle,
          headerLargeTitleEnabled: false,
          headerRight: () => (
            <HeaderIconButton
              onPress={() => Alert.alert("Watchlisted")}
              accessibilityLabel="Add to watchlist"
              iconProps={{ ios: "bookmark", android: "bookmark_add" }}
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
