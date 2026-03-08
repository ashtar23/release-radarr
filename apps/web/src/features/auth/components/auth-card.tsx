import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authCredentialsSchema,
  type AuthCredentialsInput,
} from "@repo/types/auth";
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

import { useSignInMutation } from "../queries/use-sign-in-mutation";
import { useSignOutMutation } from "../queries/use-sign-out-mutation";
import { useSignUpMutation } from "../queries/use-sign-up-mutation";
import { useAuth } from "../context/auth-context";

interface FeedbackState {
  kind: "success" | "error";
  message: string;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function AuthCard() {
  const { user, isReady, configError } = useAuth();

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const authForm = useForm<AuthCredentialsInput>({
    resolver: zodResolver(authCredentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const setErrorFeedback = (error: unknown) => {
    setFeedback({ kind: "error", message: toErrorMessage(error) });
  };

  const signInMutation = useSignInMutation({
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed in." });
    },
    onError: setErrorFeedback,
  });

  const signUpMutation = useSignUpMutation({
    onSuccess: () => {
      setFeedback({
        kind: "success",
        message:
          "Sign-up submitted. Check your email if confirmation is enabled.",
      });
    },
    onError: setErrorFeedback,
  });

  const signOutMutation = useSignOutMutation({
    onSuccess: () => {
      setFeedback({ kind: "success", message: "Signed out." });
    },
    onError: setErrorFeedback,
  });

  const isSubmitting =
    signInMutation.isPending ||
    signUpMutation.isPending ||
    signOutMutation.isPending;

  const isActionDisabled = isSubmitting || !isReady || Boolean(configError);

  const clearFeedback = () => {
    setFeedback(null);
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Auth</CardTitle>
        <CardDescription>Use email and password to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReady && (
          <p className="text-sm text-muted-foreground">Checking session...</p>
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
  );
}
