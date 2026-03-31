import type React from "react";
import { Stack } from "expo-router";
import { capabilities } from "@/constants/capabilities";

type StackScreenOptions = Exclude<
  NonNullable<React.ComponentProps<typeof Stack>["screenOptions"]>,
  (...args: never[]) => unknown
>;

export const defaultStackScreenOptions: StackScreenOptions = {
  headerBackButtonDisplayMode: "minimal",
  headerShadowVisible: false,
  headerTransparent: capabilities.headerTransparent,
  headerBlurEffect: capabilities.headerBlurEffect
    ? "systemChromeMaterial"
    : undefined,
  headerLargeTitleEnabled: true,
};
