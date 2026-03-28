import React from "react";
import { SymbolView } from "expo-symbols";
import { ScrollView, StyleSheet } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import {
  AppSymbol,
  type AndroidSymbolName,
  type IOSSymbolName,
} from "@/components/app-symbol";
import { Href } from "expo-router";
import { AppLink } from "@/components/app-link";
import { SEARCH_DEBUG_MODE_ENABLED } from "@/features/search/debug/search-debug-settings";
import { useTheme } from "@/hooks/use-theme";

type SettingsItem = {
  href: Href;
  label: string;
  iosSymbol: IOSSymbolName;
  androidSymbol: AndroidSymbolName;
};

const DEVELOPER_SETTINGS_ITEM: SettingsItem = {
  href: "/profile/settings/developer",
  label: "Developer",
  iosSymbol: "hammer",
  androidSymbol: "build",
};

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/profile/settings/general",
    label: "General",
    iosSymbol: "gear",
    androidSymbol: "settings",
  },
  {
    href: "/profile/settings/theme",
    label: "Theme",
    iosSymbol: "paintbrush",
    androidSymbol: "palette",
  },
  ...(SEARCH_DEBUG_MODE_ENABLED ? [DEVELOPER_SETTINGS_ITEM] : []),
];

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        {SETTINGS_ITEMS.map(({ href, label, iosSymbol, androidSymbol }) => (
          <AppLink key={label} href={href}>
            <ListRow
              label={label}
              leadingIcon={
                <AppSymbol ios={iosSymbol} android={androidSymbol} />
              }
              trailingIcon={
                <SymbolView
                  name={{ ios: "chevron.right" }}
                  fallback={null}
                  size={12}
                  weight="regular"
                  tintColor={theme.textSecondary}
                />
              }
            />
          </AppLink>
        ))}
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
