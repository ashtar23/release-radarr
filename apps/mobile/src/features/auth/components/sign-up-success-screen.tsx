import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { Button } from "@/components/button";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

export function SignUpSuccessScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const modalBackgroundColor = colorScheme === "dark" ? "#131313" : undefined;

  return (
    <ScrollView
      style={[
        styles.scrollView,
        modalBackgroundColor ? { backgroundColor: modalBackgroundColor } : null,
      ]}
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        <View style={styles.intro}>
          <AppSymbol
            ios="envelope.badge"
            android="mark_email_unread"
            size={48}
          />
          <ThemedText type="title" style={styles.title}>
            Check your email
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Your account was created. Confirm your email from your inbox, then
            sign in.
          </ThemedText>
        </View>
      </ListSection>

      <Button
        label="Done"
        tone="accent"
        onPress={() => router.dismiss()}
        leadingIcon={
          <AppSymbol
            ios="checkmark"
            android="done"
            tintColor={theme.interactive.linkPrimary}
          />
        }
      />
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
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  intro: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 40,
    lineHeight: 44,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
});
