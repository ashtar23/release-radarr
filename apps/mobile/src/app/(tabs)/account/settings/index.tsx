import React from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { Href } from "expo-router";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { LinkRow } from "@/components/link-row";

import {
  AppSymbol,
  type AndroidSymbolName,
  type IOSSymbolName,
} from "@/components/app-symbol";
import { SEARCH_DEBUG_MODE_ENABLED } from "@/features/settings/providers/search-debug-settings";

type SettingsItem = {
  href: Href;
  label: string;
  iosSymbol: IOSSymbolName;
  androidSymbol: AndroidSymbolName;
};

const DEVELOPER_SETTINGS_ITEM: SettingsItem = {
  href: "/account/settings/developer",
  label: "Developer",
  iosSymbol: "hammer",
  androidSymbol: "build",
};

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/account/settings/general",
    label: "General",
    iosSymbol: "gear",
    androidSymbol: "settings",
  },
  {
    href: "/account/settings/theme",
    label: "Theme",
    iosSymbol: "paintbrush",
    androidSymbol: "palette",
  },
  ...(SEARCH_DEBUG_MODE_ENABLED ? [DEVELOPER_SETTINGS_ITEM] : []),
];

export default function SettingsScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior={
        capabilities.autoContentInsets ? "automatic" : "never"
      }
      contentContainerStyle={styles.content}
    >
      <ListSection>
        {SETTINGS_ITEMS.map((item) => (
          <SettingsLinkRow key={item.label} item={item} />
        ))}
      </ListSection>
    </ScrollView>
  );
}

function SettingsLinkRow({ item }: { item: SettingsItem }) {
  return (
    <LinkRow href={item.href}>
      <ListRow
        label={item.label}
        trailingIcon={
          <AppSymbol
            ios="chevron.right"
            android="chevron_right"
            size={Platform.OS === "ios" ? 13 : 18}
          />
        }
        leadingIcon={
          <AppSymbol ios={item.iosSymbol} android={item.androidSymbol} />
        }
      />
    </LinkRow>
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
