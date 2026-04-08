import { createSoonrApiClient } from "@repo/api-client";
import { SUPABASE_WEB_ENV } from "@repo/config";

import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const apiClientConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? `Missing ${SUPABASE_WEB_ENV.url} or ${SUPABASE_WEB_ENV.publishableKey}.`
    : null;

export const apiClient =
  apiClientConfigError === null
    ? createSoonrApiClient({
        baseUrl: supabaseUrl,
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
