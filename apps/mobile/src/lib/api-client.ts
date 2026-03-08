import { createReleaseRadarApiClient } from "@repo/api-client";
import { SUPABASE_MOBILE_ENV } from "@repo/config";

import { supabase } from "./supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const apiClientConfigError =
  !supabaseUrl || !supabasePublishableKey
    ? `Missing ${SUPABASE_MOBILE_ENV.url} or ${SUPABASE_MOBILE_ENV.publishableKey}.`
    : null;

export const apiClient =
  apiClientConfigError === null
    ? createReleaseRadarApiClient({
        baseUrl: supabaseUrl!,
        publishableKey: supabasePublishableKey!,
        async getAccessToken() {
          if (!supabase) {
            return null;
          }

          const { data } = await supabase.auth.getSession();
          return data.session?.access_token ?? null;
        },
      })
    : null;
