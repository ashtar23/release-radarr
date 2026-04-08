import { createSoonrApiClient } from "@repo/api-client";
import { SUPABASE_WEB_ENV } from "@repo/config";

import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ?? undefined;

export const apiClientConfigError =
  !supabaseUrl || !supabasePublishableKey || !apiBaseUrl
    ? `Missing ${SUPABASE_WEB_ENV.url}, ${SUPABASE_WEB_ENV.publishableKey}, or VITE_API_BASE_URL.`
    : null;

export const apiClient =
  apiClientConfigError === null
    ? createSoonrApiClient({
        baseUrl: apiBaseUrl!,
        publishableKey: supabasePublishableKey,
        async getAccessToken() {
          if (!supabase) {
            return null;
          }

          const { data } = await supabase.auth.getSession();
          return data.session?.access_token ?? null;
        },
      })
    : null;

function normalizeBaseUrl(value: string | undefined) {
  if (value == null) {
    return undefined;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}
