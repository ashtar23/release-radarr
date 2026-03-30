import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { useTheme } from "@/hooks/use-theme";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

export default function GeneralSettingsScreen() {
  const theme = useTheme();
  const { hapticsEnabled, setHapticsEnabled } = useAppPreferences();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        <ListRow>
          <View style={styles.rowContent}>
            <View style={styles.rowText}>
              <ThemedText>Haptics</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Enable subtle touch feedback for supported actions.
              </ThemedText>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{
                false: theme.separator,
                true: theme.interactive.focusRing,
              }}
            />
          </View>
        </ListRow>
      </ListSection>
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
  rowContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
