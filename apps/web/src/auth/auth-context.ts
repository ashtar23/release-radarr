import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export interface AuthContextValue {
  readonly user: User | null;
  readonly session: Session | null;
  readonly isReady: boolean;
  readonly configError: string | null;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
