import { createReleaseRadarApiClient } from "@repo/api-client";
import { SUPABASE_MOBILE_ENV } from "@repo/config";

import { supabase } from "./supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const canonicalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const rawHomeApiBaseUrl = process.env.EXPO_PUBLIC_HOME_API_BASE_URL;
const rawSearchApiBaseUrl = process.env.EXPO_PUBLIC_SEARCH_API_BASE_URL;
const rawTitlesApiBaseUrl = process.env.EXPO_PUBLIC_TITLES_API_BASE_URL;
const rawNotificationsApiBaseUrl =
  process.env.EXPO_PUBLIC_NOTIFICATIONS_API_BASE_URL;
const rawWatchlistApiBaseUrl = process.env.EXPO_PUBLIC_WATCHLIST_API_BASE_URL;

const apiBaseUrl = normalizeBaseUrl(canonicalApiBaseUrl) ?? undefined;
const homeApiBaseUrl = normalizeBaseUrl(rawHomeApiBaseUrl) ?? apiBaseUrl;

export const searchApiBaseUrl =
  normalizeBaseUrl(rawSearchApiBaseUrl) ?? apiBaseUrl;

export const titlesApiBaseUrl =
  normalizeBaseUrl(rawTitlesApiBaseUrl) ?? apiBaseUrl;

export const notificationsApiBaseUrl =
  normalizeBaseUrl(rawNotificationsApiBaseUrl) ?? apiBaseUrl;

export const watchlistApiBaseUrl =
  normalizeBaseUrl(rawWatchlistApiBaseUrl) ?? apiBaseUrl;

export const notificationsRealtimeUrl = notificationsApiBaseUrl
  ? toWebSocketUrl(notificationsApiBaseUrl)
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
  !supabaseUrl || !supabasePublishableKey
    ? `Missing ${SUPABASE_MOBILE_ENV.url} or ${SUPABASE_MOBILE_ENV.publishableKey}.`
    : null;

export const apiClient =
  apiClientConfigError === null
    ? createReleaseRadarApiClient({
        baseUrl: normalizeBaseUrl(supabaseUrl!) ?? supabaseUrl!,
        homeBaseUrl: homeApiBaseUrl,
        searchBaseUrl: searchApiBaseUrl,
        notificationsBaseUrl: notificationsApiBaseUrl,
        titlesBaseUrl: titlesApiBaseUrl,
        watchlistBaseUrl: watchlistApiBaseUrl,
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
