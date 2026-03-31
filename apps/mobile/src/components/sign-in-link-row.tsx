import { Platform } from "react-native";

import { AppSymbol } from "@/components/app-symbol";
import { LinkRow } from "@/components/link-row";
import { ListRow } from "@/components/list-row";
import { useTheme } from "@/hooks/use-theme";
import { Href } from "expo-router";

type SignInLinkRowProps = {
  href?: Href;
};

export function SignInLinkRow({ href = "/auth" }: SignInLinkRowProps = {}) {
  const theme = useTheme();

  return (
    <LinkRow href={href}>
      <ListRow
        label="Sign in"
        tone="accent"
        leadingIcon={
          <AppSymbol
            ios="rectangle.portrait.and.arrow.right"
            android="login"
            tintColor={theme.interactive.linkPrimary}
          />
        }
        trailingIcon={
          Platform.OS === "ios" ? (
            <AppSymbol
              ios="chevron.right"
              size={13}
              tintColor={theme.textSecondary}
            />
          ) : undefined
        }
      />
    </LinkRow>
  );
}
