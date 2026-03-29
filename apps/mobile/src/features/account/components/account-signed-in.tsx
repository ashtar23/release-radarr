import React from "react";

import { AppSymbol } from "@/components/app-symbol";
import { Button } from "@/components/button";
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

      <Button
        label={signOutMutation.isPending ? "Signing out..." : "Sign out"}
        tone="danger"
        loading={signOutMutation.isPending}
        onPress={() => signOutMutation.mutate()}
        disabled={!canSubmit || signOutMutation.isPending}
        leadingIcon={
          <AppSymbol
            ios="rectangle.portrait.and.arrow.forward"
            android="logout"
            tintColor={theme.status.error}
          />
        }
      />
    </>
  );
}
