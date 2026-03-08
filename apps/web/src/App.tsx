import { FormEvent, useState } from "react";

import { useAuth } from "./auth/auth-context";
import "./App.css";

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearFeedback = () => {
    setMessage(null);
    setErrorMessage(null);
  };

  const onSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signInWithPassword(email, password);
      setMessage("Signed in.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignUp = async () => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signUpWithPassword(email, password);
      setMessage(
        "Sign-up submitted. Check your email if confirmation is enabled.",
      );
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignOut = async () => {
    clearFeedback();
    setIsSubmitting(true);
    try {
      await signOut();
      setMessage("Signed out.");
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <h1>Release Radar</h1>
        <p className="muted">
          Guest browsing stays open. Watchlist and notifications require auth.
        </p>
      </section>

      <section className="panel">
        <h2>Auth</h2>
        {!isReady && <p className="muted">Checking session...</p>}
        {configError && <p className="error">{configError}</p>}

        {user ? (
          <>
            <p className="muted">
              Signed in as {user.email ?? "unknown user"}.
            </p>
            <button onClick={onSignOut} disabled={isSubmitting}>
              Sign out
            </button>
          </>
        ) : (
          <form onSubmit={onSignIn} className="auth-form">
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <div className="actions">
              <button
                type="submit"
                disabled={isSubmitting || !isReady || Boolean(configError)}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={onSignUp}
                disabled={isSubmitting || !isReady || Boolean(configError)}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {message && <p className="success">{message}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
      </section>
    </main>
  );
}
