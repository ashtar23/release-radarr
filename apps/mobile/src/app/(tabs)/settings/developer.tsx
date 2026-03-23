import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { ThemedText } from "@/components/themed-text";
import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import {
  SEARCH_DEBUG_MODE_ENABLED,
  useSearchDebugSettings,
} from "@/features/search/debug/search-debug-settings";
import { useTheme } from "@/hooks/use-theme";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

export default function DeveloperSettingsScreen() {
  const theme = useTheme();
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
      <ListSection>
        <ListRow>
          <View style={styles.rowContent}>
            <View style={styles.rowText}>
              <ThemedText>Force RAWG refresh</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Bypass cache policy for search requests.
              </ThemedText>
            </View>
            <Switch
              value={forceRawgRefresh}
              onValueChange={setForceRawgRefresh}
              trackColor={{
                false: theme.separator,
                true: theme.interactive.focusRing,
              }}
            />
          </View>
        </ListRow>
        <ListRow>
          <View style={styles.rowContent}>
            <View style={styles.rowText}>
              <ThemedText>Show source badge</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Show Cache / RAWG badge in search results.
              </ThemedText>
            </View>
            <Switch
              value={showSourceBadge}
              onValueChange={setShowSourceBadge}
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
