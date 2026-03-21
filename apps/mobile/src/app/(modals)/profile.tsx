import { zodResolver } from "@hookform/resolvers/zod";

import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Button,
} from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { capabilities } from "@/constants/capabilities";
import { isDarkTheme, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export default function ProfileModalScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, isReady, configError, signInWithPassword, signOut } = useAuth();
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const { control, handleSubmit, formState, reset } =
    useForm<AuthCredentialsInput>({
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
      setFeedback(null);
      reset({ email: "", password: "" });
      router.back();
    },
    onError: (error: unknown) => {
      setFeedback(toErrorMessage(error));
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      setFeedback("Signed out.");
    },
    onError: (error: unknown) => {
      setFeedback(toErrorMessage(error));
    },
  });

  const isBusy = signInMutation.isPending || signOutMutation.isPending;
  const canSubmit = isReady && !isBusy && !configError;
  const errorTextStyle = { color: theme.status.error };
  const successTextStyle = { color: theme.status.success };
  const pageBackgroundColor = isDarkTheme(theme)
    ? theme.backgroundElement
    : theme.background;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: pageBackgroundColor }]}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={[styles.card, {}]}>
        {!isReady && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <ThemedText themeColor="textSecondary">
              Checking session...
            </ThemedText>
          </View>
        )}

        {configError ? (
          <ThemedText style={errorTextStyle}>{configError}</ThemedText>
        ) : null}

        {feedback ? (
          <ThemedText
            style={user ? successTextStyle : errorTextStyle}
            themeColor={user ? undefined : "textSecondary"}
          >
            {feedback}
          </ThemedText>
        ) : null}

        {user ? (
          <>
            <ThemedText themeColor="textSecondary">
              Signed in as {user.email ?? "unknown user"}.
            </ThemedText>
            <AppButton
              label="Sign out"
              onPress={() => signOutMutation.mutate()}
              disabled={!canSubmit}
              variant="primary"
              useGlass
            />
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor={theme.input.placeholder}
                  disabled={Boolean(configError)}
                  errorMessage={formState.errors.email?.message}
                  containerStyle={styles.inputContainer}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <AppInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  secureTextEntry
                  placeholder="Password"
                  placeholderTextColor={theme.input.placeholder}
                  disabled={Boolean(configError)}
                  errorMessage={formState.errors.password?.message}
                  containerStyle={styles.inputContainer}
                />
              )}
            />
            <Button title="test" />

            <AppButton
              label={signInMutation.isPending ? "Signing in..." : "Sign in"}
              onPress={handleSubmit((values) => {
                setFeedback(null);
                signInMutation.mutate(values);
              })}
              disabled={!canSubmit}
              loading={signInMutation.isPending}
              variant="primary"
              useGlass
            />
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
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  inputContainer: {
    backgroundColor: "transparent",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
});
