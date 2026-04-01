import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

import { ListSection } from "@/components/list-section";
import { ScreenPrompt } from "@/components/screen-prompt";
import { SignInLinkRow } from "@/components/sign-in-link-row";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function AccountSignedOut() {
  const theme = useTheme();

  return (
    <ScreenPrompt
      icon={{ ios: "person.crop.circle", android: "account_circle" }}
      title="Account"
      description="Sign in to manage your watchlist and notification preferences."
      actionContent={
        <>
          <ListSection>
            <SignInLinkRow />
          </ListSection>

          <Pressable
            onPress={() => router.push("/auth/sign-up")}
            style={styles.bottomLink}
          >
            <ThemedText themeColor="textSecondary">
              Don&apos;t have an account?{" "}
              <ThemedText style={{ color: theme.interactive.linkPrimary }}>
                Create account
              </ThemedText>
            </ThemedText>
          </Pressable>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  bottomLink: {
    alignSelf: "center",
    marginTop: Spacing.one,
  },
});
