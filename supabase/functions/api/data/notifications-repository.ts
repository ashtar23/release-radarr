import type {
  AdminClient,
  NotificationDestinationKind,
  NotificationEventInsertRow,
  NotificationEventRow,
  NotificationEventType,
  NotificationPayload,
  NotificationPreferences,
  NotificationPreferencesInsertRow,
  NotificationPreferencesRow,
  NotificationRecord,
  NotificationRecordInsertRow,
  NotificationRecordListResult,
  NotificationRecordRow,
  NotificationUnreadCountResult,
} from "../types.ts";

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  channels: {
    inApp: true,
    push: false,
  },
  events: {
    releaseDateChanged: true,
    releaseApproaching: true,
  },
  timingPresets: ["on_day"],
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;

export interface ListNotificationsParams {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface UpsertNotificationEventParams {
  readonly id: string;
  readonly titleId: string;
  readonly eventType: NotificationEventRow["event_type"];
  readonly eventVersion: number;
  readonly eventKey: string;
  readonly occurredAt: string;
  readonly payload: NotificationPayload;
}

export interface CreateNotificationRecordParams {
  readonly id: string;
  readonly userId: string;
  readonly eventId: string;
  readonly titleId: string;
  readonly eventType: NotificationRecordRow["event_type"];
  readonly destinationKind: NotificationDestinationKind;
  readonly destinationTitleId: string;
  readonly titleName: string;
  readonly titleArtworkUrl: string | null;
  readonly message: string;
  readonly subtitle: string | null;
  readonly payload: NotificationPayload;
  readonly createdAt?: string;
}

export interface NotificationFanOutAudienceMember {
  readonly userId: string;
  readonly preferences: NotificationPreferences;
}

export async function listNotificationRecords(
  client: AdminClient,
  userId: string,
  params: ListNotificationsParams,
): Promise<NotificationRecordListResult> {
  const pageLimit = normalizeLimit(params.limit);
  const decodedCursor = params.cursor ? decodeCursor(params.cursor) : null;

  let query = client
    .from("notification_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageLimit + 1);

  if (decodedCursor) {
    query = query.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as NotificationRecordRow[];
  const items = rows.slice(0, pageLimit).map(mapNotificationRecord);
  const nextCursor =
    rows.length > pageLimit
      ? encodeCursor(rows[pageLimit - 1]!.created_at, rows[pageLimit - 1]!.id)
      : null;

  return { items, nextCursor };
}

export async function getNotificationUnreadCount(
  client: AdminClient,
  userId: string,
): Promise<NotificationUnreadCountResult> {
  const { count, error } = await client
    .from("notification_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return { unreadCount: count ?? 0 };
}

export async function findNotificationRecord(
  client: AdminClient,
  userId: string,
  notificationId: string,
): Promise<NotificationRecord | null> {
  const { data, error } = await client
    .from("notification_records")
    .select("*")
    .eq("user_id", userId)
    .eq("id", notificationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapNotificationRecord(data as NotificationRecordRow);
}

export async function markNotificationRecordRead(
  client: AdminClient,
  userId: string,
  notificationId: string,
): Promise<NotificationRecord | null> {
  const { data, error } = await client
    .from("notification_records")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", notificationId)
    .is("read_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return mapNotificationRecord(data as NotificationRecordRow);
  }

  return findNotificationRecord(client, userId, notificationId);
}

export async function getNotificationPreferences(
  client: AdminClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await client
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      updatedAt: new Date(0).toISOString(),
    };
  }

  return mapNotificationPreferences(data as NotificationPreferencesRow);
}

export async function upsertNotificationPreferences(
  client: AdminClient,
  userId: string,
  preferences: Pick<
    NotificationPreferences,
    "channels" | "events" | "timingPresets"
  >,
): Promise<NotificationPreferences> {
  const row: NotificationPreferencesInsertRow = {
    user_id: userId,
    in_app_enabled: preferences.channels.inApp,
    push_enabled: preferences.channels.push,
    release_date_changed_enabled: preferences.events.releaseDateChanged,
    release_approaching_enabled: preferences.events.releaseApproaching,
    timing_presets: preferences.timingPresets,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from("notification_preferences").upsert(row, {
    onConflict: "user_id",
  });

  if (error) {
    throw new Error(error.message);
  }

  return getNotificationPreferences(client, userId);
}

export async function upsertNotificationEvent(
  client: AdminClient,
  params: UpsertNotificationEventParams,
): Promise<NotificationEventRow> {
  const row: NotificationEventInsertRow = {
    id: params.id,
    title_id: params.titleId,
    event_type: params.eventType,
    event_version: params.eventVersion,
    event_key: params.eventKey,
    occurred_at: params.occurredAt,
    payload: params.payload as unknown as NotificationEventInsertRow["payload"],
  };

  const { error } = await client.from("notification_events").upsert(row, {
    onConflict: "event_key",
  });
  if (error) {
    throw new Error(error.message);
  }

  const { data, error: selectError } = await client
    .from("notification_events")
    .select("*")
    .eq("event_key", params.eventKey)
    .single();

  if (selectError) {
    throw new Error(selectError.message);
  }

  return data as NotificationEventRow;
}

export async function upsertNotificationRecord(
  client: AdminClient,
  params: CreateNotificationRecordParams,
): Promise<NotificationRecord> {
  const row: NotificationRecordInsertRow = {
    id: params.id,
    user_id: params.userId,
    event_id: params.eventId,
    title_id: params.titleId,
    event_type: params.eventType,
    destination_kind: params.destinationKind,
    destination_title_id: params.destinationTitleId,
    title_name: params.titleName,
    title_artwork_url: params.titleArtworkUrl,
    message: params.message,
    subtitle: params.subtitle,
    payload:
      params.payload as unknown as NotificationRecordInsertRow["payload"],
    created_at: params.createdAt,
  };

  const { error } = await client.from("notification_records").upsert(row, {
    onConflict: "event_id,user_id",
  });
  if (error) {
    throw new Error(error.message);
  }

  const { data, error: selectError } = await client
    .from("notification_records")
    .select("*")
    .eq("user_id", params.userId)
    .eq("event_id", params.eventId)
    .single();

  if (selectError) {
    throw new Error(selectError.message);
  }

  return mapNotificationRecord(data as NotificationRecordRow);
}

export async function listNotificationAudienceForTitle(
  client: AdminClient,
  titleId: string,
): Promise<NotificationFanOutAudienceMember[]> {
  const { data: watchlistRows, error: watchlistError } = await client
    .from("watchlists")
    .select("user_id")
    .eq("title_id", titleId);

  if (watchlistError) {
    throw new Error(watchlistError.message);
  }

  const userIds = Array.from(
    new Set(
      (watchlistRows ?? [])
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );

  if (userIds.length === 0) {
    return [];
  }

  const { data: preferenceRows, error: preferencesError } = await client
    .from("notification_preferences")
    .select("*")
    .in("user_id", userIds);

  if (preferencesError) {
    throw new Error(preferencesError.message);
  }

  const preferencesByUserId = new Map(
    ((preferenceRows ?? []) as NotificationPreferencesRow[]).map((row) => [
      row.user_id,
      mapNotificationPreferences(row),
    ]),
  );

  return userIds.map((userId) => ({
    userId,
    preferences: preferencesByUserId.get(userId) ?? {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      updatedAt: new Date(0).toISOString(),
    },
  }));
}

export function shouldDeliverNotificationEvent(
  preferences: NotificationPreferences,
  eventType: NotificationEventType,
): boolean {
  if (!preferences.channels.inApp) {
    return false;
  }

  switch (eventType) {
    case "release_date_changed":
      return preferences.events.releaseDateChanged;
    case "release_approaching":
      return preferences.events.releaseApproaching;
    default:
      return false;
  }
}

function mapNotificationPreferences(
  row: NotificationPreferencesRow,
): NotificationPreferences {
  return {
    channels: {
      inApp: row.in_app_enabled,
      push: row.push_enabled,
    },
    events: {
      releaseDateChanged: row.release_date_changed_enabled,
      releaseApproaching: row.release_approaching_enabled,
    },
    timingPresets: row.timing_presets.flatMap((value) => {
      const parsed = parseTimingPreset(value);
      return parsed ? [parsed] : [];
    }),
    updatedAt: row.updated_at,
  };
}

function mapNotificationRecord(row: NotificationRecordRow): NotificationRecord {
  assertNotificationRecordRow(row);

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
    payload: parseNotificationPayload(row.event_type, row.payload),
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function parseNotificationPayload(
  eventType: NotificationRecordRow["event_type"],
  value: unknown,
): NotificationPayload {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  if (eventType === "release_approaching") {
    return {
      targetReleaseDate:
        typeof record.targetReleaseDate === "string"
          ? record.targetReleaseDate
          : null,
      timingPreset: parseTimingPreset(record.timingPreset) ?? "on_day",
    };
  }

  return {
    previousReleaseDate:
      typeof record.previousReleaseDate === "string"
        ? record.previousReleaseDate
        : null,
    nextReleaseDate:
      typeof record.nextReleaseDate === "string"
        ? record.nextReleaseDate
        : null,
  };
}

function parseTimingPreset(value: unknown) {
  switch (value) {
    case "on_day":
    case "hours_24_before":
    case "days_7_before":
    case "days_30_before":
      return value;
    default:
      return null;
  }
}

function normalizeLimit(limit: number | undefined) {
  if (!Number.isInteger(limit) || !limit) {
    return DEFAULT_PAGE_LIMIT;
  }

  return Math.max(1, Math.min(MAX_PAGE_LIMIT, limit));
}

function encodeCursor(createdAt: string, id: string) {
  return btoa(JSON.stringify({ createdAt, id }));
}

function decodeCursor(cursor: string) {
  try {
    const decoded = JSON.parse(atob(cursor)) as Record<string, unknown>;
    if (
      typeof decoded.createdAt === "string" &&
      typeof decoded.id === "string"
    ) {
      return { createdAt: decoded.createdAt, id: decoded.id };
    }
  } catch {
    return null;
  }

  return null;
}

function assertNotificationRecordRow(
  row: NotificationRecordRow,
): asserts row is NotificationRecordRow & {
  id: string;
  title_id: string;
  event_type: "release_date_changed" | "release_approaching";
  destination_kind: "title";
  destination_title_id: string;
  title_name: string;
  message: string;
  created_at: string;
} {
  if (
    typeof row.id !== "string" ||
    typeof row.title_id !== "string" ||
    (row.event_type !== "release_date_changed" &&
      row.event_type !== "release_approaching") ||
    row.destination_kind !== "title" ||
    typeof row.destination_title_id !== "string" ||
    typeof row.title_name !== "string" ||
    typeof row.message !== "string" ||
    typeof row.created_at !== "string"
  ) {
    throw new Error("Notification record row is invalid.");
  }
}
