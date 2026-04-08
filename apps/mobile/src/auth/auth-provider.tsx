import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase, supabaseConfigError } from "@/lib/supabase";

interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isReady: boolean;
  readonly configError: string | null;
  refreshSession(): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(!supabase);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      sessionRef.current = data.session;
      setSession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession) {
        sessionRef.current = nextSession;
        setSession(nextSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        sessionRef.current = null;
        setSession(null);
        return;
      }

      // Preserve the last known session during transient offline/startup churn.
      setSession(sessionRef.current);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const ensureClient = () => {
    if (!supabase) {
      throw new Error(supabaseConfigError ?? "Supabase is not configured.");
    }
    return supabase;
  };

  const normalizeEmail = (email: string) => email.trim();

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    isReady,
    configError: supabaseConfigError,
    async refreshSession() {
      const client = ensureClient();
      const { data } = await client.auth.getSession();
      sessionRef.current = data.session;
      setSession(data.session);
      setIsReady(true);
    },
    async signInWithPassword(email, password) {
      const client = ensureClient();
      const { error } = await client.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) throw error;
    },
    async signUpWithPassword(email, password) {
      const client = ensureClient();
      const { error } = await client.auth.signUp({
        email: normalizeEmail(email),
        password,
      });
      if (error) throw error;
    },
    async signOut() {
      const client = ensureClient();
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
