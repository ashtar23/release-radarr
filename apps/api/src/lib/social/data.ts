import { getPostgresPool } from "../postgres";
import { fetchAuthUserById } from "../auth";
import type {
  ProfileConnectionsListResult,
  ProfileWatchlistPreviewItemResult,
} from "../contracts";
import { listWatchlistItemsForUser } from "../watchlists";
import type { ProfileRecord } from "./service";

export async function isUsernameTaken(usernameNormalized: string) {
  const pool = getPostgresPool();
  const result = await pool.query<{ user_id: string }>(
    `
      select user_id
      from public.user_profiles
      where username_normalized = $1::text
      limit 1
    `,
    [usernameNormalized],
  );

  return result.rows.length > 0;
}

export async function authUserExists(userId: string) {
  const user = await fetchAuthUserById(userId);
  return user != null;
}

export async function createFollow(params: {
  followerUserId: string;
  followedUserId: string;
}) {
  const pool = getPostgresPool();
  await pool.query(
    `
      insert into public.user_follows (
        follower_user_id,
        followed_user_id
      )
      values ($1::uuid, $2::uuid)
      on conflict (follower_user_id, followed_user_id) do nothing
    `,
    [params.followerUserId, params.followedUserId],
  );
}

export async function deleteFollow(params: {
  followerUserId: string;
  followedUserId: string;
}) {
  const pool = getPostgresPool();
  await pool.query(
    `
      delete from public.user_follows
      where follower_user_id = $1::uuid
        and followed_user_id = $2::uuid
    `,
    [params.followerUserId, params.followedUserId],
  );
}

export async function isFollowing(params: {
  followerUserId: string;
  followedUserId: string;
}) {
  const pool = getPostgresPool();
  const result = await pool.query<{ follower_user_id: string }>(
    `
      select follower_user_id
      from public.user_follows
      where follower_user_id = $1::uuid
        and followed_user_id = $2::uuid
      limit 1
    `,
    [params.followerUserId, params.followedUserId],
  );

  return result.rows.length > 0;
}

export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRecord | null> {
  const pool = getPostgresPool();
  const result = await pool.query<{
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    watchlist_visibility: ProfileRecord["watchlistVisibility"];
  }>(
    `
      select
        user_id,
        username,
        display_name,
        avatar_url,
        bio,
        watchlist_visibility
      from public.user_profiles
      where user_id = $1::uuid
      limit 1
    `,
    [userId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    watchlistVisibility: row.watchlist_visibility,
  };
}

export async function getFollowCounts(userId: string) {
  const pool = getPostgresPool();
  const [followersResult, followingResult, friendsResult] = await Promise.all([
    pool.query<{ count: string }>(
      `
        select count(*)::text as count
        from public.user_follows
        where followed_user_id = $1::uuid
      `,
      [userId],
    ),
    pool.query<{ count: string }>(
      `
        select count(*)::text as count
        from public.user_follows
        where follower_user_id = $1::uuid
      `,
      [userId],
    ),
    pool.query<{ count: string }>(
      `
        select count(*)::text as count
        from public.user_follows uf
        where uf.follower_user_id = $1::uuid
          and exists (
            select 1
            from public.user_follows reverse_uf
            where reverse_uf.follower_user_id = uf.followed_user_id
              and reverse_uf.followed_user_id = uf.follower_user_id
          )
      `,
      [userId],
    ),
  ]);

  return {
    followers: Number.parseInt(followersResult.rows[0]?.count ?? "0", 10),
    following: Number.parseInt(followingResult.rows[0]?.count ?? "0", 10),
    friends: Number.parseInt(friendsResult.rows[0]?.count ?? "0", 10),
  };
}

export async function listProfileWatchlistPreview(
  userId: string,
  limit = 6,
): Promise<ProfileWatchlistPreviewItemResult[]> {
  return listProfilePreviewItems(userId, limit);
}

export async function listProfileRecentAdditionsPreview(
  userId: string,
  limit = 3,
): Promise<ProfileWatchlistPreviewItemResult[]> {
  return listProfilePreviewItems(userId, limit);
}

export async function listProfileWatchlistPage(params: {
  userId: string;
  limit: number;
  cursor: string | null;
}) {
  return listWatchlistItemsForUser(params.userId, {
    sort: "added-desc",
    limit: params.limit,
    cursor: params.cursor ?? undefined,
  });
}

export async function listFollowers(params: {
  viewerUserId: string;
  targetUserId: string;
  limit: number;
  cursor: string | null;
}): Promise<ProfileConnectionsListResult> {
  return listConnections({
    viewerUserId: params.viewerUserId,
    targetUserId: params.targetUserId,
    limit: params.limit,
    cursor: params.cursor,
    mode: "followers",
  });
}

export async function listFollowing(params: {
  viewerUserId: string;
  targetUserId: string;
  limit: number;
  cursor: string | null;
}): Promise<ProfileConnectionsListResult> {
  return listConnections({
    viewerUserId: params.viewerUserId,
    targetUserId: params.targetUserId,
    limit: params.limit,
    cursor: params.cursor,
    mode: "following",
  });
}

export async function listFriends(params: {
  viewerUserId: string;
  targetUserId: string;
  limit: number;
  cursor: string | null;
}): Promise<ProfileConnectionsListResult> {
  return listConnections({
    viewerUserId: params.viewerUserId,
    targetUserId: params.targetUserId,
    limit: params.limit,
    cursor: params.cursor,
    mode: "friends",
  });
}

async function listProfilePreviewItems(
  userId: string,
  limit: number,
): Promise<ProfileWatchlistPreviewItemResult[]> {
  const pool = getPostgresPool();
  const result = await pool.query<{
    id: string;
    title_id: string;
    name: string;
    added_at: string;
  }>(
    `
      select
        id,
        title_id,
        name,
        added_at
      from public.watchlist_items
      where user_id = $1::uuid
      order by added_at desc, id desc
      limit $2::integer
    `,
    [userId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    titleId: row.title_id,
    name: row.name,
    addedAt: toIsoDateTimeString(row.added_at),
  }));
}

type ConnectionMode = "followers" | "following" | "friends";

async function listConnections(params: {
  viewerUserId: string;
  targetUserId: string;
  limit: number;
  cursor: string | null;
  mode: ConnectionMode;
}): Promise<ProfileConnectionsListResult> {
  const pool = getPostgresPool();
  const limit = normalizeConnectionLimit(params.limit);
  const decodedCursor = params.cursor
    ? decodeConnectionCursor(params.cursor)
    : null;

  const query =
    params.mode === "followers"
      ? `
        select
          uf.created_at as relationship_created_at,
          uf.follower_user_id as connected_user_id,
          up.username,
          up.display_name,
          up.avatar_url,
          exists (
            select 1
            from public.user_follows viewer_to_connected
            where viewer_to_connected.follower_user_id = $1::uuid
              and viewer_to_connected.followed_user_id = uf.follower_user_id
          ) as viewer_follows_connected,
          exists (
            select 1
            from public.user_follows connected_to_viewer
            where connected_to_viewer.follower_user_id = uf.follower_user_id
              and connected_to_viewer.followed_user_id = $1::uuid
          ) as connected_follows_viewer
        from public.user_follows uf
        join public.user_profiles up
          on up.user_id = uf.follower_user_id
        where uf.followed_user_id = $2::uuid
          and (
            $3::timestamptz is null
            or (uf.created_at, uf.follower_user_id) < ($3::timestamptz, $4::uuid)
          )
        order by uf.created_at desc, uf.follower_user_id desc
        limit $5::integer
      `
      : params.mode === "following"
        ? `
        select
          uf.created_at as relationship_created_at,
          uf.followed_user_id as connected_user_id,
          up.username,
          up.display_name,
          up.avatar_url,
          exists (
            select 1
            from public.user_follows viewer_to_connected
            where viewer_to_connected.follower_user_id = $1::uuid
              and viewer_to_connected.followed_user_id = uf.followed_user_id
          ) as viewer_follows_connected,
          exists (
            select 1
            from public.user_follows connected_to_viewer
            where connected_to_viewer.follower_user_id = uf.followed_user_id
              and connected_to_viewer.followed_user_id = $1::uuid
          ) as connected_follows_viewer
        from public.user_follows uf
        join public.user_profiles up
          on up.user_id = uf.followed_user_id
        where uf.follower_user_id = $2::uuid
          and (
            $3::timestamptz is null
            or (uf.created_at, uf.followed_user_id) < ($3::timestamptz, $4::uuid)
          )
        order by uf.created_at desc, uf.followed_user_id desc
        limit $5::integer
      `
        : `
        select
          greatest(uf.created_at, reverse_uf.created_at) as relationship_created_at,
          uf.followed_user_id as connected_user_id,
          up.username,
          up.display_name,
          up.avatar_url,
          exists (
            select 1
            from public.user_follows viewer_to_connected
            where viewer_to_connected.follower_user_id = $1::uuid
              and viewer_to_connected.followed_user_id = uf.followed_user_id
          ) as viewer_follows_connected,
          exists (
            select 1
            from public.user_follows connected_to_viewer
            where connected_to_viewer.follower_user_id = uf.followed_user_id
              and connected_to_viewer.followed_user_id = $1::uuid
          ) as connected_follows_viewer
        from public.user_follows uf
        join public.user_follows reverse_uf
          on reverse_uf.follower_user_id = uf.followed_user_id
         and reverse_uf.followed_user_id = uf.follower_user_id
        join public.user_profiles up
          on up.user_id = uf.followed_user_id
        where uf.follower_user_id = $2::uuid
          and (
            $3::timestamptz is null
            or (greatest(uf.created_at, reverse_uf.created_at), uf.followed_user_id) < ($3::timestamptz, $4::uuid)
          )
        order by greatest(uf.created_at, reverse_uf.created_at) desc, uf.followed_user_id desc
        limit $5::integer
      `;

  const result = await pool.query<{
    relationship_created_at: string;
    connected_user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    viewer_follows_connected: boolean;
    connected_follows_viewer: boolean;
  }>(query, [
    params.viewerUserId,
    params.targetUserId,
    decodedCursor?.createdAt ?? null,
    decodedCursor?.userId ?? null,
    limit + 1,
  ]);

  const pageRows = result.rows.slice(0, limit);
  return {
    items: pageRows.map((row) => ({
      userId: row.connected_user_id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      relationship: {
        following: row.viewer_follows_connected,
        followedByViewer: row.connected_follows_viewer,
        isFriend: row.viewer_follows_connected && row.connected_follows_viewer,
      },
    })),
    nextCursor:
      result.rows.length > limit
        ? encodeConnectionCursor({
            createdAt: pageRows[pageRows.length - 1]!.relationship_created_at,
            userId: pageRows[pageRows.length - 1]!.connected_user_id,
          })
        : null,
  };
}

function normalizeConnectionLimit(limit: number) {
  if (!Number.isInteger(limit)) {
    return 20;
  }

  return Math.min(Math.max(limit, 1), 50);
}

function encodeConnectionCursor(value: { createdAt: string; userId: string }) {
  return toBase64Url(JSON.stringify(value));
}

function decodeConnectionCursor(cursor: string) {
  try {
    const parsed = JSON.parse(fromBase64Url(cursor)) as Record<string, unknown>;
    if (
      typeof parsed.createdAt !== "string" ||
      typeof parsed.userId !== "string"
    ) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      userId: parsed.userId,
    };
  } catch {
    return null;
  }
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const padding = (4 - (value.length % 4 || 4)) % 4;
  const normalized =
    value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(padding);
  return Buffer.from(normalized, "base64").toString("utf8");
}

function toIsoDateTimeString(value: string | Date) {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
