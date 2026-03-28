import React, { useState } from "react";
import { Link } from "expo-router";

import type { TitleSummary } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { apiClient, apiClientConfigError } from "@/lib/api-client";
import { AppInput } from "@/components/ui/input";

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

export default function HomeScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery).trim();
  const hasSearchInput = searchQuery.trim().length > 0;
  const showSearchResults = debouncedSearchQuery.length >= 2;

  const titlesQuery = useQuery({
    queryKey: ["titles", "search", debouncedSearchQuery],
    enabled: showSearchResults && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }

      return apiClient.searchTitles({ query: debouncedSearchQuery, signal });
    },
  });

  const clearSearch = () => {
    setSearchQuery("");
  };

  const errorTextStyle = { color: theme.status.error };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText themeColor="textSecondary">
          Guest browsing stays open. Sign in from Profile to manage your
          watchlist and notification preferences.
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="subtitle">Search</ThemedText>
        <ThemedText themeColor="textSecondary">
          Search is live as you type.
        </ThemedText>

        {apiClientConfigError && (
          <ThemedText style={errorTextStyle}>{apiClientConfigError}</ThemedText>
        )}

        <AppInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search games..."
          placeholderTextColor={theme.input.placeholder}
          editable={!apiClientConfigError}
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={clearSearch}
            disabled={!hasSearchInput}
            style={[
              styles.button,
              {
                borderColor: theme.textSecondary,
                backgroundColor: theme.backgroundElement,
              },
              !hasSearchInput && styles.buttonDisabled,
            ]}
          >
            <ThemedText type="smallBold">Clear</ThemedText>
          </Pressable>
        </View>

        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <ThemedText themeColor="textSecondary">
            Enter at least 2 characters.
          </ThemedText>
        )}

        {showSearchResults && (
          <>
            {titlesQuery.isFetching && !titlesQuery.data && (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <ThemedText themeColor="textSecondary">Searching...</ThemedText>
              </View>
            )}

            {titlesQuery.isError && (
              <ThemedText style={errorTextStyle}>
                {titlesQuery.error instanceof Error
                  ? titlesQuery.error.message
                  : "Something went wrong."}
              </ThemedText>
            )}

            {titlesQuery.data?.results.length === 0 && (
              <ThemedText themeColor="textSecondary">
                No games found for {titlesQuery.data.query}.
              </ThemedText>
            )}

            {titlesQuery.data?.results.length ? (
              <View style={styles.searchResultsList}>
                {titlesQuery.data.results.map((result) => (
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
            ) : null}
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  button: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
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
