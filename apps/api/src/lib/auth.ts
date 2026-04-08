import { getSupabaseAdmin } from "./supabase";

export function extractAccessToken(
  authorizationHeader: string | string[] | undefined,
) {
  if (Array.isArray(authorizationHeader)) {
    return extractAccessToken(authorizationHeader[0]);
  }

  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1]?.trim();
  return token ? token : null;
}

export async function authenticateAccessToken(accessToken: string) {
  const {
    data: { user },
    error,
  } = await getSupabaseAdmin().auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}
