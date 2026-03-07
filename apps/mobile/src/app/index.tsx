import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

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
  const { user, isReady, configError, signInWithPassword, signOut, signUpWithPassword } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFeedback = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const onSignIn = async () => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signInWithPassword(email, password);
      setStatusMessage("Signed in.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignUp = async () => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signUpWithPassword(email, password);
      setStatusMessage("Sign-up submitted. Check email if confirmation is enabled.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignOut = async () => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signOut();
      setStatusMessage("Signed out.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <ThemedText themeColor="textSecondary">Checking session...</ThemedText>
            </View>
          )}

          {configError && <ThemedText style={styles.errorText}>{configError}</ThemedText>}

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
                  { borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement },
                  !canSubmit && styles.buttonDisabled,
                ]}>
                <ThemedText type="smallBold">Sign out</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
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
              <TextInput
                value={password}
                onChangeText={setPassword}
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
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={onSignIn}
                  disabled={!canSubmit}
                  style={[
                    styles.button,
                    { borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement },
                    !canSubmit && styles.buttonDisabled,
                  ]}>
                  <ThemedText type="smallBold">Sign in</ThemedText>
                </Pressable>
                <Pressable
                  onPress={onSignUp}
                  disabled={!canSubmit}
                  style={[
                    styles.button,
                    { borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement },
                    !canSubmit && styles.buttonDisabled,
                  ]}>
                  <ThemedText type="smallBold">Sign up</ThemedText>
                </Pressable>
              </View>
            </>
          )}

          {statusMessage && <ThemedText style={styles.successText}>{statusMessage}</ThemedText>}
          {errorMessage && <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>}
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
