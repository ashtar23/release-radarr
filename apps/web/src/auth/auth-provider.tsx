import type { Session } from "@supabase/supabase-js";
import {
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { AuthContext, type AuthContextValue } from "./auth-context";
import { supabase, supabaseConfigError } from "../lib/supabase";

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
