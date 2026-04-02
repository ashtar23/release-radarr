import { createClient } from "@supabase/supabase-js";

import type { Database } from "../_shared/database.types.ts";
import { corsHeaders } from "./config.ts";
import { handleDetailRequest } from "./handlers/detail.ts";
import { handleHomeDiscoveryRequest } from "./handlers/home-discovery.ts";
import {
  handleNotificationPreferencesGetRequest,
  handleNotificationPreferencesPutRequest,
  handleNotificationReadRequest,
  handleNotificationsListRequest,
  handleNotificationUnreadCountRequest,
} from "./handlers/notifications.ts";
import { handleSearchRequest } from "./handlers/search.ts";
import {
  handleWatchlistAddRequest,
  handleWatchlistListRequest,
  handleWatchlistRemoveRequest,
} from "./handlers/watchlist.ts";
import { resolveRoute } from "./routing.ts";
import { jsonResponse } from "./utils/http.ts";

Deno.serve(async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const route = resolveRoute(new URL(request.url).pathname);
    if (!route) {
      return jsonResponse({ error: "Not found." }, 404);
    }

    const isTitleRoute =
      route.kind === "home-discovery" ||
      route.kind === "search" ||
      route.kind === "detail";
    const isWatchlistRoute =
      route.kind === "watchlist-list" || route.kind === "watchlist-item";
    if (
      (isTitleRoute && request.method !== "GET") ||
      (isWatchlistRoute &&
        request.method !== "GET" &&
        request.method !== "POST" &&
        request.method !== "DELETE") ||
      (route.kind === "notification-preferences" &&
        request.method !== "GET" &&
        request.method !== "PUT") ||
      ((route.kind === "notifications-list" ||
        route.kind === "notifications-unread-count") &&
        request.method !== "GET") ||
      (route.kind === "notifications-read" && request.method !== "POST")
    ) {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing." },
        500,
      );
    }

    const admin = createClient<Database>(supabaseUrl, serviceRoleKey);
    const url = new URL(request.url);
    if (route.kind === "home-discovery") {
      return handleHomeDiscoveryRequest(admin);
    }

    if (route.kind === "search") {
      return handleSearchRequest(admin, url);
    }

    if (route.kind === "detail") {
      return handleDetailRequest(admin, route.id);
    }

    const accessToken = extractAccessToken(request);
    if (!accessToken) {
      return jsonResponse({ error: "Authorization is required." }, 401);
    }

    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(accessToken);
    if (authError || !user) {
      return jsonResponse({ error: "Authentication failed." }, 401);
    }

    if (route.kind === "watchlist-list") {
      if (request.method === "GET") {
        return handleWatchlistListRequest(admin, user.id, url);
      }

      return handleWatchlistAddRequest(admin, user.id, request);
    }

    if (route.kind === "notification-preferences") {
      if (request.method === "GET") {
        return handleNotificationPreferencesGetRequest(admin, user.id);
      }

      return handleNotificationPreferencesPutRequest(admin, user.id, request);
    }

    if (route.kind === "notifications-list") {
      return handleNotificationsListRequest(admin, user.id, url);
    }

    if (route.kind === "notifications-unread-count") {
      return handleNotificationUnreadCountRequest(admin, user.id);
    }

    if (route.kind === "notifications-read") {
      return handleNotificationReadRequest(admin, user.id, route.notificationId);
    }

    return handleWatchlistRemoveRequest(admin, user.id, route.titleId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse({ error: message }, 500);
  }
});

function extractAccessToken(request: Request): string | null {
  const authorization =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");
  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1]?.trim();
  return token ? token : null;
}
