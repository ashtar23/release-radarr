import { corsHeaders } from "../config.ts";
import type {
  ApiErrorPayload,
  TitleDetails,
  TitleSearchResult,
} from "../types.ts";

export function jsonResponse(
  payload: TitleSearchResult | TitleDetails | ApiErrorPayload,
  status = 200,
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
