import { SUPABASE_WEB_ENV } from "@repo/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env[SUPABASE_WEB_ENV.url] as string | undefined;
const supabaseAnonKey = import.meta.env[SUPABASE_WEB_ENV.anonKey] as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : `Missing ${SUPABASE_WEB_ENV.url} or ${SUPABASE_WEB_ENV.anonKey}.`;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
