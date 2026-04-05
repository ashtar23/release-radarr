import type {
  NotificationPayload,
  NotificationRecord,
  NotificationRecordListResult,
  NotificationUnreadCountResult,
} from "@repo/types";

import { getPostgresPool } from "./postgres";

type NotificationUnreadCountRow = {
  unread_count: number | string;
};

type NotificationRecordRow = {
  id: string;
  title_id: string;
  event_type: NotificationRecord["eventType"];
  destination_kind: NotificationRecord["destinationKind"];
  destination_title_id: string;
  title_name: string;
  title_artwork_url: string | null;
  message: string;
  subtitle: string | null;
  payload: NotificationPayload;
  created_at: string;
  read_at: string | null;
};

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

export interface ListNotificationsParams {
  readonly cursor?: string;
  readonly limit?: number;
}

export async function getNotificationUnreadCount(
  userId: string,
): Promise<NotificationUnreadCountResult> {
  const pool = getPostgresPool();
  const result = await pool.query<NotificationUnreadCountRow>(
    `
      select count(*)::int as unread_count
      from notification_records
      where user_id = $1::uuid
        and read_at is null
    `,
    [userId],
  );

  const unreadCount = Number(result.rows[0]?.unread_count ?? 0);
  return { unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0 };
}

export async function listNotificationRecords(
  userId: string,
  params: ListNotificationsParams,
): Promise<NotificationRecordListResult> {
  const pageLimit = normalizeLimit(params.limit);
  const decodedCursor = params.cursor ? decodeCursor(params.cursor) : null;
  const pool = getPostgresPool();

  let values: unknown[] = [userId, pageLimit + 1];
  let paginationWhere = "";

  if (decodedCursor) {
    values = [userId, decodedCursor.createdAt, decodedCursor.id, pageLimit + 1];
    paginationWhere = `
      and (
        created_at < $2::timestamptz
        or (created_at = $2::timestamptz and id < $3::text)
      )
    `;
  }

  const limitParamIndex = decodedCursor ? 4 : 2;
  const result = await pool.query<NotificationRecordRow>(
    `
      select
        id,
        title_id,
        event_type,
        destination_kind,
        destination_title_id,
        title_name,
        title_artwork_url,
        message,
        subtitle,
        payload,
        created_at,
        read_at
      from notification_records
      where user_id = $1::uuid
      ${paginationWhere}
      order by created_at desc, id desc
      limit $${limitParamIndex}
    `,
    values,
  );

  const rows = result.rows;
  const items = rows.slice(0, pageLimit).map(mapNotificationRecord);
  const nextCursor =
    rows.length > pageLimit
      ? encodeCursor(rows[pageLimit - 1]!.created_at, rows[pageLimit - 1]!.id)
      : null;

  return { items, nextCursor };
}

function mapNotificationRecord(row: NotificationRecordRow): NotificationRecord {
  return {
    id: row.id,
    titleId: row.title_id,
    eventType: row.event_type,
    destinationKind: row.destination_kind,
    destinationTitleId: row.destination_title_id,
    titleName: row.title_name,
    titleArtworkUrl: row.title_artwork_url,
    message: row.message,
    subtitle: row.subtitle,
    payload: row.payload,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function normalizeLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || !limit) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_PAGE_LIMIT);
}

function encodeCursor(createdAt: string, id: string) {
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString(
    "base64url",
  );
}

function decodeCursor(cursor: string) {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as { createdAt?: unknown; id?: unknown };

    if (
      typeof parsed.createdAt === "string" &&
      parsed.createdAt.length > 0 &&
      typeof parsed.id === "string" &&
      parsed.id.length > 0
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    return null;
  }

  return null;
}
