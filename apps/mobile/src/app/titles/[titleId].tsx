import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClientConfigError } from "@/lib/api-client";
import { HeaderIconButton } from "@/components/header-icon-button";
import { useTitleDetailsQuery } from "@/features/title-details/data-access/queries/use-title-details-query";

type TitleDetailsScreenProps = {
  titleId?: string | string[];
  titleName?: string | string[];
};

export default function TitleDetailsScreen() {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };
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
          headerRight: () => (
            <HeaderIconButton
              onPress={() => Alert.alert("Watchlisted")}
              accessibilityLabel="Add to watchlist"
              iconProps={{ ios: "bookmark", android: "bookmark_add" }}
            />
          ),
        }}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
        }
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="subtitle">Title Details</ThemedText>
          <ThemedText themeColor="textSecondary">
            Details come from our backend cache and refresh flow.
          </ThemedText>

          {apiClientConfigError && (
            <ThemedText style={errorTextStyle}>
              {apiClientConfigError}
            </ThemedText>
          )}

          {!apiClientConfigError && !titleId && (
            <ThemedText style={errorTextStyle}>Invalid title id.</ThemedText>
          )}

          {!apiClientConfigError && titleId.length > 0 && isPending && (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <ThemedText themeColor="textSecondary">
                Loading title details...
              </ThemedText>
            </View>
          )}

          {!apiClientConfigError && isError && (
            <ThemedText style={errorTextStyle}>
              {toDetailErrorMessage(error)}
            </ThemedText>
          )}

          {titleDetails && (
            <View style={styles.detailsContent}>
              <View style={styles.section}>
                <ThemedText type="smallBold">{titleDetails.name}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatReleaseDate(titleDetails.earliestReleaseDate)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Platforms</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatPlatforms(titleDetails.platforms)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Description</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {titleDetails.description?.trim()
                    ? titleDetails.description
                    : "No description available."}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Genres</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(titleDetails.genres)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Developers</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(titleDetails.developers)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Publishers</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(titleDetails.publishers)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Platform Releases</ThemedText>
                {titleDetails.releases.length ? (
                  <View style={styles.releaseList}>
                    {titleDetails.releases.map((release) => (
                      <ThemedText
                        key={release.platformId}
                        themeColor="textSecondary"
                      >
                        {release.platformName}:{" "}
                        {formatReleaseDate(release.releaseDate)}
                      </ThemedText>
                    ))}
                  </View>
                ) : (
                  <ThemedText themeColor="textSecondary">
                    No platform-specific releases available.
                  </ThemedText>
                )}
              </View>
            </View>
          )}
        </ThemedView>
      </ScrollView>
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

function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

function formatPlatforms(platforms: { name: string }[]) {
  if (!platforms.length) return "Unknown";

  return platforms.map((platform) => platform.name).join(", ");
}

function formatList(values: string[]) {
  if (!values.length) return "Unknown";

  return values.join(", ");
}

function toDetailErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("(404)")) {
      return "Title not found.";
    }

    return error.message;
  }

  return "Unable to load title details.";
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  panel: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  detailsContent: {
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.one,
  },
  releaseList: {
    gap: Spacing.one,
  },
});
