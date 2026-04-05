import type { NotificationUnreadCountResult } from "@repo/types";

import { getPostgresPool } from "./postgres";

type NotificationUnreadCountRow = {
  unread_count: number | string;
};

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
