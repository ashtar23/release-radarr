import {
  findTitleById,
  upsertDetailResult,
} from "../data/titles-repository.ts";
import { mapCachedRowToTitleDetails } from "../mapping/titles.ts";
import { fetchRawgDetail } from "../providers/rawg.ts";
import type { AdminClient, TitleDetails } from "../types.ts";
import { isDetailStale } from "../utils/freshness.ts";
import { jsonResponse } from "../utils/http.ts";
import { extractRawgExternalId } from "../utils/values.ts";

export async function handleDetailRequest(
  client: AdminClient,
  titleId: string,
) {
  const localRow = await findTitleById(client, titleId);
  const returnLocalOrNotFound = () => {
    if (localRow) {
      return jsonResponse(mapCachedRowToTitleDetails(localRow));
    }

    return jsonResponse({ error: "Title not found." }, 404);
  };

  if (localRow && !isDetailStale(localRow)) {
    return jsonResponse(mapCachedRowToTitleDetails(localRow));
  }

  const rawgApiKey = Deno.env.get("RAWG_API_KEY");
  if (!rawgApiKey) {
    return returnLocalOrNotFound();
  }

  const rawgExternalId = extractRawgExternalId(titleId, localRow);
  if (!rawgExternalId) {
    return returnLocalOrNotFound();
  }

  const normalizedDetail = await tryFetchRawgDetail(rawgExternalId, rawgApiKey);
  if (!normalizedDetail) {
    return returnLocalOrNotFound();
  }

  const now = new Date().toISOString();
  const errorMessage = await upsertDetailResult(client, normalizedDetail, now);

  if (errorMessage) {
    return jsonResponse({ error: errorMessage }, 500);
  }

  return jsonResponse(normalizedDetail);
}

async function tryFetchRawgDetail(
  rawgExternalId: string,
  rawgApiKey: string,
): Promise<TitleDetails | null> {
  try {
    return await fetchRawgDetail(rawgExternalId, rawgApiKey);
  } catch {
    return null;
  }
}
