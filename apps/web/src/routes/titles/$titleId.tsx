import { createFileRoute } from "@tanstack/react-router";

import { TitleDetailsPage } from "@/features/titles";

export const Route = createFileRoute("/titles/$titleId")({
  component: TitleDetailsRoute,
});

function TitleDetailsRoute() {
  const { titleId } = Route.useParams();
  return <TitleDetailsPage titleId={titleId} />;
}
