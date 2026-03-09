import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

import { ModeToggle } from "@/components/mode-toggle";
import {
  titleDetailsConfigError,
} from "../data-access/get-title-details";
import { useTitleDetailsQuery } from "../queries/use-title-details-query";

interface TitleDetailsPageProps {
  titleId: string;
}

export function TitleDetailsPage({ titleId }: TitleDetailsPageProps) {
  const detailsQuery = useTitleDetailsQuery(titleId);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to search
          </Link>
          <ModeToggle />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game Details</CardTitle>
            <CardDescription>
              Cached details are served from backend and refreshed when stale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {titleDetailsConfigError && (
              <Alert variant="destructive">
                <AlertTitle>Details configuration error</AlertTitle>
                <AlertDescription>{titleDetailsConfigError}</AlertDescription>
              </Alert>
            )}

            {!titleDetailsConfigError && detailsQuery.isPending && (
              <p className="text-sm text-muted-foreground">
                Loading title details...
              </p>
            )}

            {!titleDetailsConfigError && detailsQuery.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {toDetailErrorMessage(detailsQuery.error)}
                </AlertDescription>
              </Alert>
            )}

            {detailsQuery.data && (
              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {detailsQuery.data.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formatReleaseDate(detailsQuery.data.earliestReleaseDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Platforms</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPlatforms(detailsQuery.data.platforms)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {detailsQuery.data.description?.trim()
                      ? detailsQuery.data.description
                      : "No description available."}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Genres</p>
                  <p className="text-sm text-muted-foreground">
                    {formatList(detailsQuery.data.genres)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Developers</p>
                  <p className="text-sm text-muted-foreground">
                    {formatList(detailsQuery.data.developers)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Publishers</p>
                  <p className="text-sm text-muted-foreground">
                    {formatList(detailsQuery.data.publishers)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Platform Releases</p>
                  {detailsQuery.data.releases.length ? (
                    <ul className="space-y-1">
                      {detailsQuery.data.releases.map((release) => (
                        <li key={release.platformId} className="text-sm">
                          <span className="font-medium">
                            {release.platformName}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            • {formatReleaseDate(release.releaseDate)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No platform-specific releases available.
                    </p>
                  )}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatReleaseDate(value: string | null) {
  if (!value) {
    return "Release date unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatPlatforms(platforms: Array<{ name: string }>) {
  if (!platforms.length) {
    return "Unknown";
  }

  return platforms.map((platform) => platform.name).join(", ");
}

function formatList(values: string[]) {
  if (!values.length) {
    return "Unknown";
  }

  return values.join(", ");
}

function toDetailErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("(404)")) {
      return "Title not found.";
    }

    return error.message;
  }

  return "Unable to load title details.";
}
