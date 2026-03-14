import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import { capabilities } from "@/constants/capabilities";
import { Spacing } from "@/constants/theme";
import { ListSection } from "@/components/list-section";
import {
  AppSymbol,
  type AndroidSymbolName,
  type IOSSymbolName,
} from "@/auth/app-symbol";
import { Href } from "expo-router";
import { AppLink } from "@/components/app-link";

type SettingsItem = {
  href: Href;
  label: string;
  iosSymbol: IOSSymbolName;
  androidSymbol: AndroidSymbolName;
};

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/settings/general",
    label: "General",
    iosSymbol: "gearshape",
    androidSymbol: "settings",
  },
  {
    href: "/settings/theme",
    label: "Theme",
    iosSymbol: "paintbrush",
    androidSymbol: "palette",
  },
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
        {SETTINGS_ITEMS.map(({ href, label, iosSymbol, androidSymbol }) => (
          <AppLink
            key={label}
            href={href}
            label={label}
            leadingIcon={<AppSymbol ios={iosSymbol} android={androidSymbol} />}
          />
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
