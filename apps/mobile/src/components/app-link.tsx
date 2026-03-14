import { Link, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import type { PressableProps } from "react-native";

import { PressableRow } from "@/components/pressable-row";
import { useTheme } from "@/hooks/use-theme";

export type AppLinkProps = Omit<PressableProps, "onPress" | "children"> & {
  href: Href;
  replace?: boolean;
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
};

export function AppLink({
  href,
  replace = false,
  label,
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: AppLinkProps) {
  const theme = useTheme();

  const defaultTrailing = (
    <SymbolView
      name={{ ios: "chevron.right" }}
      fallback={null}
      size={12}
      weight="regular"
      tintColor={theme.textSecondary}
    />
  );

  return (
    <Link href={href} replace={replace} asChild>
      <PressableRow
        label={label}
        leadingIcon={leadingIcon}
        trailingIcon={
          trailingIcon === undefined ? defaultTrailing : trailingIcon
        }
        {...rest}
      >
        {children}
      </PressableRow>
    </Link>
  );
}
