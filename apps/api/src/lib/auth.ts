import { getPostgresPool } from "./postgres";
import { getSupabaseAdmin } from "./supabase";
import { normalizeAuthEmail } from "./auth-service";

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

export async function fetchAuthUserById(userId: string) {
  const {
    data: { user },
    error,
  } = await getSupabaseAdmin().auth.admin.getUserById(userId);

  if (error || !user) {
    return null;
  }

  return user;
}

export async function findAuthUserByEmail(email: string) {
  const normalizedEmail = normalizeAuthEmail(email);
  let page = 1;

  while (true) {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const matchedUser =
      data.users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail) ??
      null;

    if (matchedUser) {
      return matchedUser;
    }

    if (!data.nextPage || data.users.length === 0) {
      return null;
    }

    page = data.nextPage;
  }
}

export async function findAuthIdentityByEmail(email: string) {
  const pool = getPostgresPool();
  const normalizedEmail = normalizeAuthEmail(email);
  const result = await pool.query<{ user_id: string; email: string }>(
    `
      select user_id, email
      from public.auth_user_identities
      where email_normalized = $1::text
      limit 1
    `,
    [normalizedEmail],
  );

  return result.rows[0] ?? null;
}

export async function upsertAuthIdentity(params: {
  userId: string;
  email: string;
}) {
  const pool = getPostgresPool();
  await pool.query(
    `
      insert into public.auth_user_identities (
        user_id,
        email
      )
      values ($1::uuid, $2::text)
      on conflict (user_id) do update
      set
        email = excluded.email,
        updated_at = timezone('utc', now())
    `,
    [params.userId, normalizeAuthEmail(params.email)],
  );
}

export async function isAuthEmailRegistered(email: string) {
  const cachedIdentity = await findAuthIdentityByEmail(email);
  if (cachedIdentity) {
    return true;
  }

  const user = await findAuthUserByEmail(email);
  if (user?.email) {
    await upsertAuthIdentity({
      userId: user.id,
      email: user.email,
    });
  }

  return user !== null;
}
