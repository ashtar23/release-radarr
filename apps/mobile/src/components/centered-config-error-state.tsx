import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

import { CenteredEmptyState } from "./centered-empty-state";

type CenteredConfigErrorStateProps = {
  title: string;
  description: string;
  helpText: string;
};

export function CenteredConfigErrorState({
  title,
  description,
  helpText,
}: CenteredConfigErrorStateProps) {
  const theme = useTheme();

  return (
    <CenteredEmptyState
      title={title}
      description={description}
      action={
        <ThemedText style={{ color: theme.status.error }}>{helpText}</ThemedText>
      }
    />
  );
}
