import type { ReactNode } from "react";

import { CenteredStateFrame } from "@/components/centered-state-frame";
import { EmptyState } from "@/components/empty-state";

type CenteredEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function CenteredEmptyState({
  title,
  description,
  icon,
  action,
}: CenteredEmptyStateProps) {
  return (
    <CenteredStateFrame>
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        action={action}
      />
    </CenteredStateFrame>
  );
}
