import { getApiErrorMessage } from "@repo/api-client";

export function extractErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  return getApiErrorMessage(error, fallback);
}
