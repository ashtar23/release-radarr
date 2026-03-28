import React from "react";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { ProfileScreen } from "@/features/profile/components";

const PROFILE_HEADER_ACTIONS: HeaderAction[] = [
  {
    kind: "button",
    id: "profile-settings",
    label: "Open settings",
    iosIcon: "gear",
    androidIcon: "settings",
    href: "/profile/settings",
  },
];

export default function ProfileRoute() {
  return (
    <>
      <HeaderActions actions={PROFILE_HEADER_ACTIONS} />
      <ProfileScreen />
    </>
  );
}
