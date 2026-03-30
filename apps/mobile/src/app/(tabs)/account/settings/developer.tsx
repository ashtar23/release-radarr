import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import {
  SEARCH_DEBUG_MODE_ENABLED,
  useSearchDebugSettings,
} from "@/features/settings/providers/search-debug-settings";
import { ScrollView, StyleSheet } from "react-native";

export default function DeveloperSettingsScreen() {
  const {
    forceRawgRefresh,
    showSourceBadge,
    setForceRawgRefresh,
    setShowSourceBadge,
  } = useSearchDebugSettings();

  if (!SEARCH_DEBUG_MODE_ENABLED) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior={
          capabilities.autoContentInsets ? "automatic" : "never"
        }
        contentContainerStyle={styles.content}
      >
        <ThemedText>
          Developer settings are available only in debug mode.
        </ThemedText>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection title="Search">
        <ListSwitchRow
          label="Force RAWG refresh"
          subtitle="Bypass cache policy for search requests."
          value={forceRawgRefresh}
          onValueChange={setForceRawgRefresh}
        />
        <ListSwitchRow
          label="Show source badge"
          subtitle="Show Cache / RAWG badge in search results."
          value={showSourceBadge}
          onValueChange={setShowSourceBadge}
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
