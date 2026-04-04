import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { env } from "./env";

export const supabaseAdmin = createClient<Database>(
  env.supabaseUrl,
  env.supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
