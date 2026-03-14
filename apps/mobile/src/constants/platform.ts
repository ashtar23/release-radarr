import { Platform } from "react-native";

export const iosVersion =
  Platform.OS === "ios" ? parseInt(Platform.Version as string, 10) : 0;

export const androidVersion =
  Platform.OS === "android" ? (Platform.Version as number) : 0;

/** Documented minimum deployment targets. */
export const minIosVersion = 16;
export const minAndroidVersion = 28;
