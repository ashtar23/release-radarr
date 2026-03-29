import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useSignUpMutation } from "../queries";
import { EmbeddedTextInput } from "@/components/embedded-text-input";
import { useAuth } from "@/auth/auth-provider";
import { router } from "expo-router";
import {
  SignUpCredentialsInput,
  signUpCredentialsSchema,
} from "@repo/types/auth";

export function SignUpScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const modalBackgroundColor = colorScheme === "dark" ? "#131313" : undefined;

  const { isReady, configError } = useAuth();

  const canSubmit = isReady && !configError;

  const { control, handleSubmit, formState, reset } =
    useForm<SignUpCredentialsInput>({
      resolver: zodResolver(signUpCredentialsSchema),
      defaultValues: {
        email: "",
        password: "",
        repeatedPassword: "",
      },
    });

  const signUpMutation = useSignUpMutation({
    onSuccess: () => {
      reset({ email: "", password: "", repeatedPassword: "" });
      router.replace("/auth/success");
    },
  });

  const authError = signUpMutation.errorMessage;

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
              <EmbeddedTextInput
                value={value}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  if (authError) {
                    signUpMutation.resetErrorState();
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
                    signUpMutation.resetErrorState();
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

          <Controller
            control={control}
            name="repeatedPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <EmbeddedTextInput
                value={value}
                onBlur={onBlur}
                onChangeText={(nextValue) => {
                  if (authError) {
                    signUpMutation.resetErrorState();
                  }
                  onChange(nextValue);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                secureTextEntry
                allowPasswordToggle
                placeholder="Repeat Password"
                disabled={Boolean(configError)}
                errorMessage={formState.errors.repeatedPassword?.message}
              />
            )}
          />
        </ListSection>

        {authError ? (
          <ThemedText style={[styles.message, { color: theme.status.error }]}>
            {authError}
          </ThemedText>
        ) : null}

        <ListSection>
          <ActionRow
            onPress={handleSubmit((values) => {
              signUpMutation.mutate(values);
            })}
            disabled={!canSubmit || signUpMutation.isPending}
          >
            <ListRow
              label={signUpMutation.isPending ? "Creating account..." : "Sign Up"}
              tone="accent"
              contentAlignment="center"
              leadingIcon={
                signUpMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.interactive.linkPrimary}
                  />
                ) : (
                  <AppSymbol
                    ios="person.crop.circle.badge.plus"
                    android="app_registration"
                    tintColor={theme.interactive.linkPrimary}
                  />
                )
              }
            />
          </ActionRow>
        </ListSection>

        <Pressable
          onPress={() => router.replace("/auth")}
          style={styles.bottomLink}
        >
          <ThemedText themeColor="textSecondary">
            Already have an account?{" "}
            <ThemedText style={{ color: theme.interactive.linkPrimary }}>
              Sign in
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
