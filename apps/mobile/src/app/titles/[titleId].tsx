import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export default function TitleDetailsScreen() {
  const theme = useTheme();
  const errorTextStyle = { color: theme.status.error };
  const { titleId: rawTitleId, titleName: rawTitleName } =
    useLocalSearchParams<{
      titleId?: string | string[];
      titleName?: string | string[];
    }>();
  const titleId = normalizeParam(rawTitleId).trim();
  const initialTitle = normalizeParam(rawTitleName).trim();
  const headerTitle = detailsQueryNamePlaceholder(initialTitle);

  const detailsQuery = useQuery({
    queryKey: ["titles", "detail", titleId],
    enabled: titleId.length > 0 && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Title details API is not configured.",
        );
      }

      return apiClient.getTitleDetails({ id: titleId, signal });
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: detailsQuery.data?.name?.trim() || headerTitle,
        }}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : "never"
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

          {!apiClientConfigError &&
            titleId.length > 0 &&
            detailsQuery.isPending && (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <ThemedText themeColor="textSecondary">
                  Loading title details...
                </ThemedText>
              </View>
            )}

          {!apiClientConfigError && detailsQuery.isError && (
            <ThemedText style={errorTextStyle}>
              {toDetailErrorMessage(detailsQuery.error)}
            </ThemedText>
          )}

          {detailsQuery.data && (
            <View style={styles.detailsContent}>
              <View style={styles.section}>
                <ThemedText type="smallBold">
                  {detailsQuery.data.name}
                </ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatReleaseDate(detailsQuery.data.earliestReleaseDate)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Platforms</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatPlatforms(detailsQuery.data.platforms)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Description</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {detailsQuery.data.description?.trim()
                    ? detailsQuery.data.description
                    : "No description available."}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Genres</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(detailsQuery.data.genres)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Developers</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(detailsQuery.data.developers)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Publishers</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {formatList(detailsQuery.data.publishers)}
                </ThemedText>
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Platform Releases</ThemedText>
                {detailsQuery.data.releases.length ? (
                  <View style={styles.releaseList}>
                    {detailsQuery.data.releases.map((release) => (
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

function normalizeParam(value: string | string[] | undefined) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
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
