import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

import { CenteredOfflineState } from "@/components/centered-offline-state";
import { OfflineBanner } from "@/components/offline-banner";
import {
  TitleDetailsContent,
  TitleDetailsStateView,
} from "@/features/title-details/components";
import { HeaderActions } from "@/features/navigation/header-actions";
import { useTitleDetailsScreen } from "@/features/title-details/hooks/use-title-details-screen";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { useIsOffline } from "@/lib/react-query-online";
import { Spacing } from "@/constants/theme";

type TitleDetailsScreenProps = {
  titleId?: string | string[];
  titleName?: string | string[];
};

export default function TitleDetailsScreen() {
  const { titleId: rawTitleId, titleName: rawTitleName } =
    useLocalSearchParams<TitleDetailsScreenProps>();

  const titleId = normalizeRouteParam(rawTitleId);
  const initialTitle = normalizeRouteParam(rawTitleName);
  const isOffline = useIsOffline();
  const { headerActions, screenTitle, state, retry, retrying } =
    useTitleDetailsScreen({
      titleId,
      initialTitle,
    });

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLargeTitleEnabled: false,
        }}
      />

      {isOffline && state.mode !== "ready" ? (
        <CenteredOfflineState
          description="Reconnect to load this title and its release details."
          onRetry={retry}
          retrying={retrying}
        />
      ) : state.mode !== "ready" ? (
        <TitleDetailsStateView state={state} />
      ) : (
        <>
          <HeaderActions actions={headerActions} />

          <ScreenScrollView contentContainerStyle={styles.content}>
            {isOffline ? (
              <OfflineBanner
                message="You’re offline. Showing the last loaded title details."
                style={styles.offlineBanner}
              />
            ) : null}
            <TitleDetailsContent details={state.details} />
          </ScreenScrollView>
        </>
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

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
  offlineBanner: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
});
