import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { EmbeddedTextInput } from "@/components/embedded-text-input";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useSignInMutation, useSignOutMutation } from "@/features/auth/queries";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { useTheme } from "@/hooks/use-theme";

const PROFILE_HEADER_ACTIONS: HeaderAction[] = [
  {
    kind: "button",
    id: "profile-settings",
    label: "Open settings",
    iosIcon: "gear",
    androidIcon: "settings",
    href: "/profile/settings",
  },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, isReady, configError } = useAuth();

  const { control, handleSubmit, formState, reset } =
    useForm<AuthCredentialsInput>({
      resolver: zodResolver(authCredentialsSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });

  const signInMutation = useSignInMutation({
    onSuccess: () => {
      reset({ email: "", password: "" });
    },
  });

  const signOutMutation = useSignOutMutation({
    onSuccess: () => {
      reset({ email: "", password: "" });
    },
  });

  const isBusy = signInMutation.isPending || signOutMutation.isPending;
  const canSubmit = isReady && !isBusy && !configError;
  const errorTextStyle = { color: theme.status.error };
  const authError = signInMutation.errorMessage;

  return (
    <>
      <HeaderActions actions={PROFILE_HEADER_ACTIONS} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentInsetAdjustmentBehavior={
            capabilities.autoContentInsets ? "automatic" : "never"
          }
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!isReady ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator />
              <ThemedText themeColor="textSecondary">
                Checking session...
              </ThemedText>
            </View>
          ) : null}

          {configError ? (
            <ThemedText style={errorTextStyle}>{configError}</ThemedText>
          ) : null}

          {user ? (
            <>
              <ListSection>
                <ListRow
                  label="Email"
                  subtitle={user.email ?? "No email available"}
                  trailingIcon={<AppSymbol ios="envelope" android="mail" />}
                />

                <ListRow
                  label="Account status"
                  subtitle="Signed in"
                  trailingIcon={
                    <AppSymbol ios="checkmark.seal" android="verified_user" />
                  }
                />
              </ListSection>

              <ListSection>
                <ActionRow
                  onPress={() => signOutMutation.mutate()}
                  disabled={!canSubmit}
                >
                  <ListRow
                    label={
                      signOutMutation.isPending ? "Signing out..." : "Sign out"
                    }
                    tone="destructive"
                    leadingIcon={
                      <AppSymbol
                        ios="rectangle.portrait.and.arrow.right"
                        android="logout"
                        tintColor={theme.status.error}
                      />
                    }
                  />
                </ActionRow>
              </ListSection>
            </>
          ) : (
            <>
              <View style={styles.sectionIntro}>
                <ThemedText type="title">Sign in to Release Radar</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Create an account to manage your watchlist and notification
                  preferences.
                </ThemedText>
              </View>

              <ListSection>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <EmbeddedTextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        if (authError) {
                          signInMutation.resetErrorState();
                        }
                        onChange(nextValue);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      keyboardType="email-address"
                      placeholder="Email"
                      disabled={Boolean(configError)}
                      errorMessage={formState.errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <EmbeddedTextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        if (authError) {
                          signInMutation.resetErrorState();
                        }
                        onChange(nextValue);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      secureTextEntry
                      allowPasswordToggle
                      placeholder="Password"
                      disabled={Boolean(configError)}
                      errorMessage={formState.errors.password?.message}
                    />
                  )}
                />
              </ListSection>

              {authError ? (
                <ThemedText style={errorTextStyle}>{authError}</ThemedText>
              ) : null}

              <ListSection>
                <ActionRow
                  onPress={handleSubmit((values) => {
                    signInMutation.mutate(values);
                  })}
                  disabled={!canSubmit}
                >
                  <ListRow
                    label={
                      signInMutation.isPending ? "Signing in..." : "Sign in"
                    }
                    tone="accent"
                    leadingIcon={
                      <AppSymbol
                        ios="rectangle.portrait.and.arrow.right"
                        android="login"
                        tintColor={theme.interactive.linkPrimary}
                      />
                    }
                  />
                </ActionRow>
              </ListSection>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  identityBlock: {
    gap: Spacing.one,
  },
  sectionIntro: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  rowContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
