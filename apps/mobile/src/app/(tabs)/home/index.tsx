import React, { useState } from "react";
import { Link } from "expo-router";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import type { TitleSummary } from "@repo/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { apiClient, apiClientConfigError } from "@/lib/api-client";
import { AppInput } from "@/components/ui/input";

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

export default function HomeScreen() {
  const theme = useTheme();
  const {
    user,
    isReady,
    configError,
    signInWithPassword,
    signOut,
    signUpWithPassword,
  } = useAuth();

  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
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

  const { control, handleSubmit, formState } = useForm<AuthCredentialsInput>({
    resolver: zodResolver(authCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signInWithPassword(values.email, values.password);
    },
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed in." });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signUpWithPassword(values.email, values.password);
    },
    onSuccess: () => {
      setFeedback({
        kind: "success",
        message:
          "Sign-up submitted. Check your email if confirmation is enabled.",
      });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed out." });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const clearFeedback = () => {
    setFeedback(null);
  };

  const onSignIn = handleSubmit((values) => {
    clearFeedback();
    signInMutation.mutate(values);
  });

  const onSignUp = handleSubmit((values) => {
    clearFeedback();
    signUpMutation.mutate(values);
  });

  const onSignOut = () => {
    clearFeedback();
    signOutMutation.mutate();
  };

  const isSubmitting =
    signInMutation.isPending ||
    signUpMutation.isPending ||
    signOutMutation.isPending;
  const canSubmit = isReady && !isSubmitting && !configError;

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior={
        Platform.OS === "ios" ? "automatic" : "never"
      }
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText themeColor="textSecondary">
          Guest browsing stays open. Watchlist and notifications require auth.
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="subtitle">Search</ThemedText>
        <ThemedText themeColor="textSecondary">
          Search is live as you type.
        </ThemedText>

        {apiClientConfigError && (
          <ThemedText style={styles.errorText}>
            {apiClientConfigError}
          </ThemedText>
        )}

        <AppInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search games..."
          placeholderTextColor={theme.textSecondary}
          editable={!apiClientConfigError}
        />

        {/* <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search games..."
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              borderColor: theme.textSecondary,
              color: theme.text,
              backgroundColor: theme.background,
            },
          ]}
          editable={!apiClientConfigError}
        /> */}

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
              <ThemedText style={styles.errorText}>
                {toErrorMessage(titlesQuery.error)}
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

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="subtitle">Auth</ThemedText>

        {!isReady && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <ThemedText themeColor="textSecondary">
              Checking session...
            </ThemedText>
          </View>
        )}

        {configError && (
          <ThemedText style={styles.errorText}>{configError}</ThemedText>
        )}

        {user ? (
          <>
            <ThemedText themeColor="textSecondary">
              Signed in as {user.email ?? "unknown user"}.
            </ThemedText>
            <Pressable
              onPress={onSignOut}
              disabled={!canSubmit}
              style={[
                styles.button,
                {
                  borderColor: theme.textSecondary,
                  backgroundColor: theme.backgroundElement,
                },
                !canSubmit && styles.buttonDisabled,
              ]}
            >
              <ThemedText type="smallBold">Sign out</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.textSecondary,
                      color: theme.text,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
              )}
            />
            {formState.errors.email?.message && (
              <ThemedText style={styles.errorText}>
                {formState.errors.email.message}
              </ThemedText>
            )}
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.textSecondary,
                      color: theme.text,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
              )}
            />
            {formState.errors.password?.message && (
              <ThemedText style={styles.errorText}>
                {formState.errors.password.message}
              </ThemedText>
            )}
            <View style={styles.buttonRow}>
              <Pressable
                onPress={onSignIn}
                disabled={!canSubmit}
                style={[
                  styles.button,
                  {
                    borderColor: theme.textSecondary,
                    backgroundColor: theme.backgroundElement,
                  },
                  !canSubmit && styles.buttonDisabled,
                ]}
              >
                <ThemedText type="smallBold">Sign in</ThemedText>
              </Pressable>
              <Pressable
                onPress={onSignUp}
                disabled={!canSubmit}
                style={[
                  styles.button,
                  {
                    borderColor: theme.textSecondary,
                    backgroundColor: theme.backgroundElement,
                  },
                  !canSubmit && styles.buttonDisabled,
                ]}
              >
                <ThemedText type="smallBold">Sign up</ThemedText>
              </Pressable>
            </View>
          </>
        )}

        {feedback?.kind === "success" && (
          <ThemedText style={styles.successText}>{feedback.message}</ThemedText>
        )}
        {feedback?.kind === "error" && (
          <ThemedText style={styles.errorText}>{feedback.message}</ThemedText>
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
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
  successText: {
    color: "#0f6b2c",
  },
  errorText: {
    color: "#b42318",
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
