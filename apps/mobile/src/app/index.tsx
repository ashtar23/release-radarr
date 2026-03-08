import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/auth/auth-provider";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
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

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView type="backgroundElement" style={styles.panel}>
          <ThemedText type="title">Release Radar</ThemedText>
          <ThemedText themeColor="textSecondary">
            Guest browsing stays open. Watchlist and notifications require auth.
          </ThemedText>
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
            <ThemedText style={styles.successText}>
              {feedback.message}
            </ThemedText>
          )}
          {feedback?.kind === "error" && (
            <ThemedText style={styles.errorText}>{feedback.message}</ThemedText>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
  },
  safeArea: {
    width: "100%",
    maxWidth: 640,
    flex: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
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
});
