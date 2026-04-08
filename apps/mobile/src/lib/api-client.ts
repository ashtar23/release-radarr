import { createSoonrApiClient } from "@repo/api-client";
import { SUPABASE_MOBILE_ENV } from "@repo/config";

import { supabase } from "./supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const apiBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ?? undefined;

export const notificationsRealtimeUrl = apiBaseUrl
  ? toWebSocketUrl(apiBaseUrl)
  : null;

const OFFLINE_AUTH_ERROR_PATTERNS = [
  "failed to fetch",
  "network request failed",
  "request timed out",
  "timed out",
  "offline",
  "load failed",
];

function isLikelyOfflineAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLocaleLowerCase();
  return OFFLINE_AUTH_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

export const apiClientConfigError =
  !supabaseUrl || !supabasePublishableKey || !apiBaseUrl
    ? `Missing ${SUPABASE_MOBILE_ENV.url}, ${SUPABASE_MOBILE_ENV.publishableKey}, or EXPO_PUBLIC_API_BASE_URL.`
    : null;

export const apiClient =
  apiClientConfigError === null
    ? createSoonrApiClient({
        baseUrl: apiBaseUrl!,
        publishableKey: supabasePublishableKey!,
        async getAccessToken() {
          if (!supabase) {
            return null;
          }

          const { data } = await supabase.auth.getSession();
          return data.session?.access_token ?? null;
        },
        async onUnauthorized() {
          if (!supabase) {
            return false;
          }

          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data.session) {
              return true;
            }

            if (isLikelyOfflineAuthError(error)) {
              return false;
            }
          } catch (error) {
            if (isLikelyOfflineAuthError(error)) {
              return false;
            }
          }

          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          return false;
        },
      })
    : null;

function normalizeBaseUrl(value: string | undefined) {
  if (value == null) {
    return undefined;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toWebSocketUrl(value: string) {
  if (value.startsWith("https://")) {
    return `wss://${value.slice("https://".length)}`;
  }

  if (value.startsWith("http://")) {
    return `ws://${value.slice("http://".length)}`;
  }

  return value;
}
