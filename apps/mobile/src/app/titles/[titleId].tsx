import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

import {
  TitleDetailsContent,
  TitleDetailsStateView,
} from "@/features/title-details/components";
import { HeaderActions } from "@/features/navigation/header-actions";
import { useTitleDetailsScreen } from "@/features/title-details/hooks/use-title-details-screen";
import { ScreenScrollView } from "@/components/screen-scroll-view";

type TitleDetailsScreenProps = {
  titleId?: string | string[];
  titleName?: string | string[];
};

export default function TitleDetailsScreen() {
  const { titleId: rawTitleId, titleName: rawTitleName } =
    useLocalSearchParams<TitleDetailsScreenProps>();

  const titleId = normalizeRouteParam(rawTitleId);
  const initialTitle = normalizeRouteParam(rawTitleName);
  const { headerActions, screenTitle, state } = useTitleDetailsScreen({
    titleId,
    initialTitle,
  });

  if (state.mode !== "ready") {
    return (
      <>
        <Stack.Screen
          options={{
            title: screenTitle,
            headerLargeTitleEnabled: false,
          }}
        />

        <TitleDetailsStateView state={state} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLargeTitleEnabled: false,
        }}
      />

      <HeaderActions actions={headerActions} />

      <ScreenScrollView contentContainerStyle={styles.content}>
        <TitleDetailsContent details={state.details} />
      </ScreenScrollView>
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
});
