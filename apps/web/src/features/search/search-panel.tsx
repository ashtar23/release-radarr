import { useState } from "react";
import type { TitleSummary } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

const MIN_QUERY_LENGTH = 2;

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatPlatforms(result: TitleSummary) {
  if (!result.platforms.length) return "Unknown";
  return result.platforms.map((platform) => platform.name).join(", ");
}

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query).trim();

  const searchQuery = useQuery({
    queryKey: ["titles", "search", debouncedQuery],
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(
          apiClientConfigError ?? "Search API is not configured.",
        );
      }
      return apiClient.searchTitles({ query: debouncedQuery, signal });
    },
  });

  const trimmedQuery = query.trim();
  const hasMinimumLength =
    trimmedQuery.length === 0 || trimmedQuery.length >= MIN_QUERY_LENGTH;
  const hasQuery = trimmedQuery.length > 0;
  const showResults = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const clearQuery = () => {
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Games</CardTitle>
        <CardDescription>
          Search checks local cache first and refreshes from provider when
          results are weak or stale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiClientConfigError && (
          <Alert variant="destructive">
            <AlertTitle>Search configuration error</AlertTitle>
            <AlertDescription>{apiClientConfigError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="search-query">Query</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: witcher, zelda, bloodborne..."
              disabled={Boolean(apiClientConfigError)}
              aria-invalid={!hasMinimumLength}
            />
            <Button
              type="button"
              variant="outline"
              onClick={clearQuery}
              disabled={!hasQuery}
            >
              Clear
            </Button>
          </div>
          {!hasMinimumLength && (
            <p className="text-sm text-destructive">
              Enter at least {MIN_QUERY_LENGTH} characters.
            </p>
          )}
        </div>

        {showResults && !apiClientConfigError && (
          <div className="space-y-3">
            {searchQuery.isFetching && !searchQuery.data && (
              <p className="text-sm text-muted-foreground">Searching...</p>
            )}

            {searchQuery.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {toErrorMessage(searchQuery.error)}
                </AlertDescription>
              </Alert>
            )}

            {searchQuery.data?.results.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No games found for &quot;{searchQuery.data.query}&quot;.
              </p>
            )}

            {searchQuery.data?.results.length ? (
              <ul className="space-y-2">
                {searchQuery.data.results.map((result) => (
                  <li
                    key={result.id}
                    className="rounded-md border bg-background p-3"
                  >
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatReleaseDate(result.earliestReleaseDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Platforms: {formatPlatforms(result)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
