import { AppSymbol } from "@/components/app-symbol";
import { Button } from "@/components/button";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  signInCredentialsSchema,
  type SignInCredentialsInput,
} from "@repo/types/auth";
import { useSignInMutation } from "../queries";
import { TextInput } from "@/components/text-input";
import { useAuth } from "@/auth/auth-provider";
import { router } from "expo-router";

export function SignInScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const modalBackgroundColor = colorScheme === "dark" ? "#131313" : undefined;

  const { isReady, configError } = useAuth();

  const canSubmit = isReady && !configError;

  const { control, handleSubmit, formState, reset } =
    useForm<SignInCredentialsInput>({
      resolver: zodResolver(signInCredentialsSchema),
      defaultValues: {
        email: "",
        password: "",
      },
    });

  const signInMutation = useSignInMutation({
    onSuccess: () => {
      reset({ email: "", password: "" });
      router.back();
    },
  });

  const authError = signInMutation.errorMessage;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[
          styles.scrollView,
          modalBackgroundColor
            ? { backgroundColor: modalBackgroundColor }
            : null,
        ]}
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
        }
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ListSection>
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                value={value}
                onBlur={onBlur}
                leadingSlot={
                  <AppSymbol
                    ios="envelope"
                    android="email"
                    size={20}
                    tintColor={theme.textSecondary}
                  />
                }
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
              <TextInput
                value={value}
                leadingSlot={
                  <AppSymbol
                    ios="lock"
                    android="lock"
                    size={20}
                    tintColor={theme.textSecondary}
                  />
                }
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
              />
            )}
          />
        </ListSection>
        <Button
          label={signInMutation.isPending ? "Signing in..." : "Sign In"}
          tone="accent"
          loading={signInMutation.isPending}
          onPress={handleSubmit((values) => {
            signInMutation.mutate(values);
          })}
          disabled={!canSubmit || signInMutation.isPending}
          leadingIcon={
            <AppSymbol
              ios="arrow.right.circle"
              android="login"
              tintColor={theme.interactive.linkPrimary}
            />
          }
        />

        {authError ? (
          <ThemedText style={[styles.message, { color: theme.status.error }]}>
            {authError}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={() => router.replace("/auth/sign-up")}
          style={styles.bottomLink}
        >
          <ThemedText themeColor="textSecondary">
            Don&apos;t have an account?{" "}
            <ThemedText style={{ color: theme.interactive.linkPrimary }}>
              Create account
            </ThemedText>
          </ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: { flex: 1 },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  message: {
    paddingHorizontal: Spacing.three,
  },
  bottomLink: {
    alignSelf: "center",
  },
});
