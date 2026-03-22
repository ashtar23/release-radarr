import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import type { TitleDetails } from "@repo/types";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { titleDetailsConfigError } from "../data-access/get-title-details";
import { toDetailErrorMessage } from "../utils/title-details-format";
import { TitleDetailsContent } from "./title-details-content";

type TitleDetailsStateViewProps = {
  titleId: string;
  titleDetails: TitleDetails | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

export function TitleDetailsStateView({
  titleId,
  titleDetails,
  isPending,
  isError,
  error,
}: TitleDetailsStateViewProps) {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };

  return (
    <ScrollView
      style={[
        styles.scrollView,
        {
          backgroundColor: theme.background,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {titleDetailsConfigError && (
        <View style={styles.messageBlock}>
          <ThemedText style={errorTextStyle}>
            {titleDetailsConfigError}
          </ThemedText>
        </View>
      )}

      {!titleDetailsConfigError && !titleId && (
        <View style={styles.messageBlock}>
          <ThemedText style={errorTextStyle}>Invalid title id.</ThemedText>
        </View>
      )}

      {!titleDetailsConfigError && titleId.length > 0 && isPending && (
        <View style={[styles.messageBlock, styles.loadingRow]}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">
            Loading title details...
          </ThemedText>
        </View>
      )}

      {!titleDetailsConfigError && isError && (
        <View style={styles.messageBlock}>
          <ThemedText style={errorTextStyle}>
            {toDetailErrorMessage(error)}
          </ThemedText>
        </View>
      )}

      {titleDetails && <TitleDetailsContent details={titleDetails} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  messageBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
});
