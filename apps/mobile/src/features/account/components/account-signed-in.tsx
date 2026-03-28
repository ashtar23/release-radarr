import React from "react";

import { ActionRow } from "@/components/action-row";
import { AppSymbol } from "@/components/app-symbol";
import { ListRow } from "@/components/list-row";
import { ListSection } from "@/components/list-section";
import { useSignOutMutation } from "@/features/auth/queries";
import { useTheme } from "@/hooks/use-theme";

type AccountSignedInProps = {
  canSubmit: boolean;
  email: string | null | undefined;
  onSignedOut: () => void;
};

export function AccountSignedIn({
  canSubmit,
  email,
  onSignedOut,
}: AccountSignedInProps) {
  const theme = useTheme();

  const signOutMutation = useSignOutMutation({
    onSuccess: onSignedOut,
  });

  return (
    <>
      <ListSection>
        <ListRow
          label="Email"
          subtitle={email ?? "No email available"}
          trailingIcon={<AppSymbol ios="envelope" android="mail" />}
        />

        <ListRow
          label="Account status"
          subtitle="Signed in"
          trailingIcon={
            <AppSymbol ios="checkmark.seal" android="verified_user" />
          }
        />
      </ListSection>

      <ListSection>
        <ActionRow
          onPress={() => signOutMutation.mutate()}
          disabled={!canSubmit || signOutMutation.isPending}
        >
          <ListRow
            label={signOutMutation.isPending ? "Signing out..." : "Sign out"}
            tone="destructive"
            leadingIcon={
              <AppSymbol
                ios="rectangle.portrait.and.arrow.right"
                android="logout"
                tintColor={theme.status.error}
              />
            }
          />
        </ActionRow>
      </ListSection>
    </>
  );
}
