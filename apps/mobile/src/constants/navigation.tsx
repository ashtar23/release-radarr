import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { capabilities } from "@/constants/capabilities";

export const defaultStackScreenOptions: NativeStackNavigationOptions = {
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
  headerTransparent: capabilities.headerTransparent,
  headerBlurEffect: capabilities.headerBlurEffect
    ? "systemChromeMaterial"
    : undefined,
  headerLargeTitleEnabled: true,
};
