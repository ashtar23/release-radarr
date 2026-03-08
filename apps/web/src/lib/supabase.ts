import { initializeSupabaseClient } from "@repo/api-client";
import { SUPABASE_WEB_ENV } from "@repo/config";

const initializedClient = initializeSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  missingConfigMessage: `Missing ${SUPABASE_WEB_ENV.url} or ${SUPABASE_WEB_ENV.publishableKey}.`,
});

export const isSupabaseConfigured = initializedClient.isConfigured;

export const supabaseConfigError = initializedClient.configError;

export const supabase = initializedClient.client;
