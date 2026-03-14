import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { ScrollView, StyleSheet } from "react-native";

export default function GeneralSettingsScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ThemedText>General Settings</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
});
