import React from "react";
import { Platform } from "react-native";
import { Href } from "expo-router";

import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { LinkRow } from "@/components/link-row";
import { ScreenScrollView } from "@/components/screen-scroll-view";

import {
  AppSymbol,
  type AndroidSymbolName,
  type IOSSymbolName,
} from "@/components/app-symbol";
import { useAuthGate } from "@/auth/use-auth-gate";
import { SEARCH_DEBUG_MODE_ENABLED } from "@/features/settings/providers/search-debug-settings";
import { useTheme } from "@/hooks/use-theme";

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

const BASE_SETTINGS_ITEMS: SettingsItem[] = [
  {
    href: "/account/settings/general",
    label: "General",
    iosSymbol: "gear",
    androidSymbol: "settings",
  },
  {
    href: "/account/settings/notifications",
    label: "Notifications",
    iosSymbol: "bell",
    androidSymbol: "notifications",
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
  const { isSignedIn } = useAuthGate();

  const settingsItems = isSignedIn
    ? BASE_SETTINGS_ITEMS
    : BASE_SETTINGS_ITEMS.filter(
        (item) => item.href !== "/account/settings/notifications",
      );

  return (
    <ScreenScrollView>
      <ListSection>
        {settingsItems.map((item) => (
          <SettingsLinkRow key={item.label} item={item} />
        ))}
      </ListSection>
    </ScreenScrollView>
  );
}

function SettingsLinkRow({ item }: { item: SettingsItem }) {
  const theme = useTheme();

  return (
    <LinkRow href={item.href}>
      <ListRow
        label={item.label}
        trailingIcon={
          Platform.OS === "ios" ? (
            <AppSymbol
              ios="chevron.right"
              size={13}
              tintColor={theme.textSecondary}
            />
          ) : undefined
        }
        leadingIcon={
          <AppSymbol ios={item.iosSymbol} android={item.androidSymbol} />
        }
      />
    </LinkRow>
  );
}
