import { ListSection } from "@/components/list-section";
import { ListSwitchRow } from "@/components/list-switch-row";
import { ScreenScrollView } from "@/components/screen-scroll-view";
import { ThemedText } from "@/components/themed-text";
import {
  SEARCH_DEBUG_MODE_ENABLED,
  useSearchDebugSettings,
} from "@/features/settings/providers/search-debug-settings";

export default function DeveloperSettingsScreen() {
  const {
    forceRawgRefresh,
    showSourceBadge,
    setForceRawgRefresh,
    setShowSourceBadge,
  } = useSearchDebugSettings();

  if (!SEARCH_DEBUG_MODE_ENABLED) {
    return (
      <ScreenScrollView>
        <ThemedText>
          Developer settings are available only in debug mode.
        </ThemedText>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
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
    </ScreenScrollView>
  );
}
