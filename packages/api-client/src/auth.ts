export type AccessTokenProvider =
  | (() => Promise<string | null> | string | null)
  | undefined;

export async function resolveAccessToken(getAccessToken: AccessTokenProvider) {
  if (!getAccessToken) {
    return null;
  }

  return (await getAccessToken()) ?? null;
}

export function buildAuthHeaders(
  publishableKey: string,
  accessToken: string | null,
) {
  return {
    apikey: publishableKey,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}
