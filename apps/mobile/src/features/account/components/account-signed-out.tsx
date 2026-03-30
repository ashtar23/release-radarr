import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LinkRow } from "@/components/link-row";
import { router } from "expo-router";
import { Button } from "@/components/button";

export function AccountSignedOut() {
  const theme = useTheme();

  return (
    <>
      <ListSection>
        <View style={styles.sectionIntro}>
          <AppSymbol
            ios="person.crop.circle"
            android="account_circle"
            size={48}
          />
          <ThemedText type="title" style={styles.heading}>
            Account
          </ThemedText>
          <ThemedText style={styles.sectionSubtitle} themeColor="textSecondary">
            Sign in to manage your watchlist and notification preferences.
          </ThemedText>
        </View>
      </ListSection>

      <ListSection>
        <LinkRow href="/auth">
          <ListRow
            label="Sign in"
            tone="accent"
            leadingIcon={
              <AppSymbol
                ios="arrow.right.circle"
                android="login"
                tintColor={theme.interactive.linkPrimary}
              />
            }
          />
        </LinkRow>
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
  );
}

const styles = StyleSheet.create({
  sectionIntro: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionSubtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
  },
  bottomLink: {
    alignSelf: "center",
    marginTop: Spacing.one,
  },
});
