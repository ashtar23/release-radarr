import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

import { ProfileHeaderButton } from "@/components/profile-header-button";
import { capabilities } from "@/constants/capabilities";

export const defaultStackScreenOptions: NativeStackNavigationOptions = {
  headerBackButtonDisplayMode: "minimal",
  headerRight: () => <ProfileHeaderButton />,
  headerShadowVisible: false,
  headerTransparent: capabilities.headerTransparent,
  headerBlurEffect: capabilities.headerBlurEffect
    ? "systemChromeMaterial"
    : undefined,
  headerLargeTitleEnabled: true,
};
