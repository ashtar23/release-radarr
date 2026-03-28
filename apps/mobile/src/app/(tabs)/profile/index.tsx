import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useAuth } from "@/auth/auth-provider";
import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
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
  const { user, isReady, configError, signInWithPassword, signOut } = useAuth();

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
      reset({ email: "", password: "" });
    },
    onError: (error: unknown) => {},
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      reset({ email: "", password: "" });
    },
    onError: (error: unknown) => {},
  });

  const isBusy = signInMutation.isPending || signOutMutation.isPending;
  const canSubmit = isReady && !isBusy && !configError;
  const errorTextStyle = { color: theme.status.error };

  return (
    <>
      <HeaderActions actions={PROFILE_HEADER_ACTIONS} />

      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
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
                label="sddsfsfsdf"
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
            <View style={styles.identityBlock}>
              <ThemedText type="title">Sign in to Release Radar</ThemedText>
              <ThemedText themeColor="textSecondary">
                Create an account to manage your watchlist and notification
                preferences.
              </ThemedText>
            </View>

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

            <AppButton
              label={signInMutation.isPending ? "Signing in..." : "Sign in"}
              onPress={handleSubmit((values) => {
                signInMutation.mutate(values);
              })}
              disabled={!canSubmit}
              loading={signInMutation.isPending}
              variant="primary"
              useGlass
            />
          </>
        )}
      </ScrollView>
    </>
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
  identityBlock: {
    gap: Spacing.one,
  },
  inputContainer: {
    backgroundColor: "transparent",
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
