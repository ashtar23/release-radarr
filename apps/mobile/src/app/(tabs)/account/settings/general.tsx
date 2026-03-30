import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { useAppPreferences } from "@/features/settings/providers/app-preferences";
import { ScrollView, StyleSheet } from "react-native";

export default function GeneralSettingsScreen() {
  const { hapticsEnabled, setHapticsEnabled } = useAppPreferences();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        <ListSwitchRow
          label="Haptics"
          subtitle="Enable subtle touch feedback for supported actions."
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
        />
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
});
