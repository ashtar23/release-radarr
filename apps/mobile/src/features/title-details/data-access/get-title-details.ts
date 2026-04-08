import type { TitleDetailsResponse } from "@repo/api-client";
import { apiClient, apiClientConfigError } from "@/lib/api-client";

export const titleDetailsConfigError = apiClientConfigError;

type GetTitleDetailsParams = {
  id: string;
  signal?: AbortSignal;
};

function getTitleDetails({
  id,
  signal,
}: GetTitleDetailsParams): Promise<TitleDetailsResponse> {
  if (!id) {
    throw new Error("Title ID cannot be empty.");
  }

  if (!apiClient) {
    throw new Error(
      titleDetailsConfigError ?? "Title details API is not configured.",
    );
  }

  return apiClient.getTitleDetails({ id, signal });
}

export { getTitleDetails };
