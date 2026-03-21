export type AccessTokenProvider =
  | (() => Promise<string | null> | string | null)
  | undefined;

export async function resolveAccessToken(
  fallbackToken: string,
  getAccessToken: AccessTokenProvider,
) {
  if (!getAccessToken) {
    return fallbackToken;
  }

  const token = await getAccessToken();
  return token ?? fallbackToken;
}

export function buildAuthHeaders(publishableKey: string, accessToken: string) {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken}`,
  };
}
