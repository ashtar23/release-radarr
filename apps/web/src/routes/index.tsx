import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/features/search/pages";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  return <SearchPage />;
}
