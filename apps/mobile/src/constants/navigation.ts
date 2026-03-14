import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

import { capabilities } from "@/constants/capabilities";

export const defaultStackScreenOptions: NativeStackNavigationOptions = {
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
  headerTransparent: Platform.OS === "ios",
  headerBlurEffect: capabilities.headerBlurEffect
    ? "systemChromeMaterial"
    : undefined,
  headerLargeTitleEnabled: true,
};
