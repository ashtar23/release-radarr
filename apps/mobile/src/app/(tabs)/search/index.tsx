import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { Link, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { TitleSummary } from "@repo/types";

import { EmptyState } from "@/components/empty-state";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatPlatforms(result: TitleSummary) {
  if (!result.platforms.length) return "Unknown";
  return result.platforms.map((platform) => platform.name).join(", ");
}

export default function SearchTabScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const rawQuery = query.trim();
  const debouncedQuery = useDebouncedValue(query).trim();
  const showSearchResults = debouncedQuery.length >= 2;
  const errorTextStyle = { color: theme.status.error };
  const emptyStateDescription =
    rawQuery.length === 0
      ? "Start typing in the search bar to find games."
      : "Enter at least 2 characters to search.";

  const titlesQuery = useQuery({
    queryKey: ["titles", "search", debouncedQuery],
    enabled: showSearchResults && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }

      return apiClient.searchTitles({ query: debouncedQuery, signal });
    },
  });
  const results = titlesQuery.data?.results ?? [];
  const hasResults = results.length > 0;

  const content =
    showSearchResults && hasResults ? (
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior={
          Platform.OS === "ios" ? "automatic" : "never"
        }
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <ThemedView type="backgroundElement" style={styles.panel}>
          {titlesQuery.isFetching && !titlesQuery.data && (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <ThemedText themeColor="textSecondary">Searching...</ThemedText>
            </View>
          )}

          {titlesQuery.isError && (
            <ThemedText style={errorTextStyle}>
              {toErrorMessage(titlesQuery.error)}
            </ThemedText>
          )}

          <View style={styles.searchResultsList}>
            {results.map((result) => (
              <Link
                key={result.id}
                href={{
                  pathname: "/titles/[titleId]",
                  params: { titleId: result.id, titleName: result.name },
                }}
                asChild
              >
                <Pressable>
                  <ThemedView
                    type="background"
                    style={[
                      styles.searchResultItem,
                      { borderColor: theme.textSecondary },
                    ]}
                  >
                    <ThemedText type="smallBold">{result.name}</ThemedText>
                    <ThemedText themeColor="textSecondary">
                      {formatReleaseDate(result.earliestReleaseDate)}
                    </ThemedText>
                    <ThemedText themeColor="textSecondary">
                      Platforms: {formatPlatforms(result)}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
    ) : (
      <View style={styles.emptyRoot}>
        {apiClientConfigError ? (
          <ThemedText style={errorTextStyle}>{apiClientConfigError}</ThemedText>
        ) : showSearchResults && titlesQuery.isFetching ? (
          <EmptyState
            icon={<ActivityIndicator />}
            title="Searching..."
            description="Looking up matching games."
          />
        ) : showSearchResults && titlesQuery.isError ? (
          <EmptyState
            title="Search failed"
            description={toErrorMessage(titlesQuery.error)}
          />
        ) : showSearchResults ? (
          <EmptyState
            title="No games found"
            description={`Try another query instead of “${debouncedQuery}”.`}
          />
        ) : (
          <EmptyState
            title="Search Games"
            description={emptyStateDescription}
          />
        )}
      </View>
    );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: "Search" }} />
      <Stack.SearchBar
        autoFocus
        hideNavigationBar={false}
        placement="automatic"
        placeholder="Search games..."
        onChangeText={(event) => {
          setQuery(event.nativeEvent.text);
        }}
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.three,
  },
  panel: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  emptyRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
  },
  emptyIcon: {
    fontSize: 44,
    lineHeight: 44,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  searchResultsList: {
    gap: Spacing.two,
  },
  searchResultItem: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.one,
  },
});
