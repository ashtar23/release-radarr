import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  titleSearchQuerySchema,
  type TitleSearchQueryInput,
  type TitleSummary,
} from "@repo/types";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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

import { useAuth } from "./auth/auth-context";
import { apiClient, apiClientConfigError } from "./lib/api-client";

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

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

export default function App() {
  const {
    user,
    isReady,
    configError,
    signInWithPassword,
    signOut,
    signUpWithPassword,
  } = useAuth();

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState("");

  const authForm = useForm<AuthCredentialsInput>({
    resolver: zodResolver(authCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const searchForm = useForm<TitleSearchQueryInput>({
    resolver: zodResolver(titleSearchQuerySchema),
    defaultValues: {
      query: "",
    },
  });

  const searchQuery = useQuery({
    queryKey: ["titles", "search", submittedQuery],
    enabled: submittedQuery.length > 0 && Boolean(apiClient),
    queryFn: ({ signal }) => {
      if (!apiClient) {
        throw new Error(apiClientConfigError ?? "Search API is not configured.");
      }

      return apiClient.searchTitles({ query: submittedQuery, signal });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signInWithPassword(values.email, values.password);
    },
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed in." });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signUpWithPassword(values.email, values.password);
    },
    onSuccess: () => {
      setFeedback({
        kind: "success",
        message:
          "Sign-up submitted. Check your email if confirmation is enabled.",
      });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed out." });
    },
    onError: (error: unknown) => {
      setFeedback({ kind: "error", message: toErrorMessage(error) });
    },
  });

  const isSubmitting =
    signInMutation.isPending ||
    signUpMutation.isPending ||
    signOutMutation.isPending;

  const isActionDisabled = isSubmitting || !isReady || Boolean(configError);

  const clearFeedback = () => {
    setFeedback(null);
  };

  const onSearch = searchForm.handleSubmit((values) => {
    setSubmittedQuery(values.query.trim());
  });

  const onSignIn = authForm.handleSubmit((values) => {
    clearFeedback();
    signInMutation.mutate(values);
  });

  const onSignUp = authForm.handleSubmit((values) => {
    clearFeedback();
    signUpMutation.mutate(values);
  });

  const onSignOut = () => {
    clearFeedback();
    signOutMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Release Radar</CardTitle>
            <CardDescription>
              Guest browsing stays open. Watchlist and notifications require
              auth.
            </CardDescription>
          </CardHeader>
        </Card>

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

            <form
              onSubmit={onSearch}
              className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start"
            >
              <div className="space-y-2">
                <Label htmlFor="search-query">Query</Label>
                <Input
                  id="search-query"
                  placeholder="Try: witcher, zelda, bloodborne..."
                  aria-invalid={Boolean(searchForm.formState.errors.query)}
                  {...searchForm.register("query")}
                />
                {searchForm.formState.errors.query?.message && (
                  <p className="text-sm text-destructive">
                    {searchForm.formState.errors.query.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={Boolean(apiClientConfigError) || searchQuery.isFetching}
                className="sm:mt-8"
              >
                Search
              </Button>
            </form>

            {submittedQuery.length > 0 && !apiClientConfigError && (
              <div className="space-y-3">
                {searchQuery.isFetching && (
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

        <Card>
          <CardHeader>
            <CardTitle>Auth</CardTitle>
            <CardDescription>
              Use email and password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReady && (
              <p className="text-sm text-muted-foreground">
                Checking session...
              </p>
            )}

            {configError && (
              <Alert variant="destructive">
                <AlertTitle>Configuration error</AlertTitle>
                <AlertDescription>{configError}</AlertDescription>
              </Alert>
            )}

            {user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Signed in as {user.email ?? "unknown user"}.
                </p>
                <Button onClick={onSignOut} disabled={isSubmitting}>
                  Sign out
                </Button>
              </div>
            ) : (
              <form onSubmit={onSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isActionDisabled}
                    aria-invalid={Boolean(authForm.formState.errors.email)}
                    {...authForm.register("email")}
                  />
                  {authForm.formState.errors.email?.message && (
                    <p className="text-sm text-destructive">
                      {authForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isActionDisabled}
                    aria-invalid={Boolean(authForm.formState.errors.password)}
                    {...authForm.register("password")}
                  />
                  {authForm.formState.errors.password?.message && (
                    <p className="text-sm text-destructive">
                      {authForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isActionDisabled}>
                    Sign in
                  </Button>
                  <Button
                    type="button"
                    onClick={onSignUp}
                    variant="outline"
                    disabled={isActionDisabled}
                  >
                    Sign up
                  </Button>
                </div>
              </form>
            )}

            {feedback && (
              <Alert
                variant={feedback.kind === "error" ? "destructive" : "default"}
              >
                <AlertDescription>{feedback.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatPlatforms(result: TitleSummary) {
  if (!result.platforms.length) return "Unknown";
  return result.platforms.map((platform) => platform.name).join(", ");
}
