import { ActivityIndicator } from "react-native";

import { useTheme } from "@/hooks/use-theme";

import { CenteredEmptyState } from "./centered-empty-state";

type CenteredLoadingStateProps = {
  title: string;
  description: string;
};

export function CenteredLoadingState({
  title,
  description,
}: CenteredLoadingStateProps) {
  const theme = useTheme();

  return (
    <CenteredEmptyState
      title={title}
      description={description}
      icon={<ActivityIndicator size="small" color={theme.text} />}
    />
  );
}
