import { apiClient, apiClientConfigError } from "@/lib/api-client";

interface GetTitleDetailsParams {
  id: string;
  signal?: AbortSignal;
}

export const titleDetailsConfigError = apiClientConfigError;

export function getTitleDetails({ id, signal }: GetTitleDetailsParams) {
  if (!apiClient) {
    throw new Error(
      titleDetailsConfigError ?? "Title details API is not configured.",
    );
  }

  return apiClient.getTitleDetails({ id, signal });
}
