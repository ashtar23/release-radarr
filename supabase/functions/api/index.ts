import { createClient } from "@supabase/supabase-js";

import type { Database } from "../_shared/database.types.ts";
import { corsHeaders } from "./config.ts";
import { handleDetailRequest } from "./handlers/detail.ts";
import { handleSearchRequest } from "./handlers/search.ts";
import { resolveRoute } from "./routing.ts";
import { jsonResponse } from "./utils/http.ts";

Deno.serve(async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const route = resolveRoute(new URL(request.url).pathname);
    if (!route) {
      return jsonResponse({ error: "Not found." }, 404);
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
    if (route.kind === "search") {
      return handleSearchRequest(admin, url);
    }

    return handleDetailRequest(admin, route.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse({ error: message }, 500);
  }
});
