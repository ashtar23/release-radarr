import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase, supabaseConfigError } from "@/lib/supabase";

interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isReady: boolean;
  readonly configError: string | null;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
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

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session,
    isReady,
    configError: supabaseConfigError,
    async signInWithPassword(email, password) {
      const client = ensureClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUpWithPassword(email, password) {
      const client = ensureClient();
      const { error } = await client.auth.signUp({ email, password });
      if (error) throw error;
    },
    async signOut() {
      const client = ensureClient();
      const { error } = await client.auth.signOut();
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
