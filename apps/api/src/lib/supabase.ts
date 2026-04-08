import { createClient } from "@supabase/supabase-js";

import type { Database } from "@shared/database-types";
import { env } from "./env";

let supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null;

// Keep this helper available for endpoints that still rely on Supabase-backed
// data access during the migration, but phase 1 routes should prefer direct
// Postgres access through DATABASE_URL.
export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error("Supabase client requested without Supabase env vars.");
  }

  supabaseAdmin = createClient<Database>(env.supabaseUrl, env.supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}
