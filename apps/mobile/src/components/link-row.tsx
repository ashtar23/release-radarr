import { Link, type Href } from "expo-router";
import type { ReactNode } from "react";
import type { PressableProps } from "react-native";

import { ActionRow } from "@/components/action-row";

export type LinkRowProps = Omit<PressableProps, "onPress" | "children"> & {
  href: Href;
  replace?: boolean;
  children: ReactNode;
};

/**
 * A navigation wrapper for row-like content.
 *
 * Compose this around a `ListRow` when tapping the row should navigate to a new
 * screen while preserving the platform press feedback from `Link` + `Pressable`.
 */
export function LinkRow({
  href,
  replace = false,
  children,
  ...rest
}: LinkRowProps) {
  return (
    <Link href={href} replace={replace} asChild>
      <ActionRow {...rest}>
        {children}
      </ActionRow>
    </Link>
  );
}
