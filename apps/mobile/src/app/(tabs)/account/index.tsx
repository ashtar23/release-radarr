import React from "react";
import {
  HeaderActions,
  type HeaderAction,
} from "@/features/navigation/header-actions";
import { AccountScreen } from "@/features/account/components";

const ACCOUNT_HEADER_ACTIONS: HeaderAction[] = [
  {
    kind: "button",
    id: "account-settings",
    label: "Open settings",
    iosIcon: "gear",
    androidIcon: "settings",
    href: "/account/settings",
  },
];

export default function AccountRoute() {
  return (
    <>
      <HeaderActions actions={ACCOUNT_HEADER_ACTIONS} />
      <AccountScreen />
    </>
  );
}
