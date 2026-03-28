import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { EmbeddedTextInput } from "@/components/embedded-text-input";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useSignInMutation } from "@/features/auth/queries";
import { useTheme } from "@/hooks/use-theme";

type AccountSignedOutProps = {
  canSubmit: boolean;
  configError: string | null;
};

export function AccountSignedOut({
  canSubmit,
  configError,
}: AccountSignedOutProps) {
  const theme = useTheme();

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

  const authError = signInMutation.errorMessage;

  return (
    <>
      <View style={styles.sectionIntro}>
        <AppSymbol
          ios="person.crop.circle"
          android="account_circle"
          size={48}
        />
        <ThemedText type="title">Account</ThemedText>
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
        <ThemedText style={{ color: theme.status.error }}>
          {authError}
        </ThemedText>
      ) : null}

      <ListSection>
        <ActionRow
          onPress={handleSubmit((values) => {
            signInMutation.mutate(values);
          })}
          disabled={!canSubmit || signInMutation.isPending}
        >
          <ListRow
            label={signInMutation.isPending ? "Signing in..." : "Sign in"}
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
  );
}

const styles = StyleSheet.create({
  sectionIntro: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
    justifyContent: "center",
    alignItems: "center",
  },
});
