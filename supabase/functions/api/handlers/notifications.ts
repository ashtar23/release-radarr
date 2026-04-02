import type { AdminClient, NotificationPreferences } from "../types.ts";
import {
  getNotificationPreferences,
  getNotificationUnreadCount,
  listNotificationRecords,
  markNotificationRecordRead,
  upsertNotificationPreferences,
} from "../data/notifications-repository.ts";
import { jsonResponse } from "../utils/http.ts";

export async function handleNotificationsListRequest(
  client: AdminClient,
  userId: string,
  url: URL,
) {
  const result = await listNotificationRecords(client, userId, {
    cursor: parseCursor(url),
    limit: parseLimit(url),
  });

  return jsonResponse(result);
}

export async function handleNotificationUnreadCountRequest(
  client: AdminClient,
  userId: string,
) {
  const result = await getNotificationUnreadCount(client, userId);
  return jsonResponse(result);
}

export async function handleNotificationReadRequest(
  client: AdminClient,
  userId: string,
  notificationId: string,
) {
  const normalizedNotificationId = notificationId.trim();
  if (!normalizedNotificationId) {
    return jsonResponse({ error: "notificationId is required." }, 400);
  }

  const notification = await markNotificationRecordRead(
    client,
    userId,
    normalizedNotificationId,
  );

  if (!notification) {
    return jsonResponse({ error: "Notification not found." }, 404);
  }

  return jsonResponse({ notification });
}

export async function handleNotificationPreferencesGetRequest(
  client: AdminClient,
  userId: string,
) {
  const preferences = await getNotificationPreferences(client, userId);
  return jsonResponse({ preferences });
}

export async function handleNotificationPreferencesPutRequest(
  client: AdminClient,
  userId: string,
  request: Request,
) {
  const preferences = await parseNotificationPreferencesBody(request);
  if (!preferences) {
    return jsonResponse({ error: "Notification preferences payload is invalid." }, 400);
  }

  const updatedPreferences = await upsertNotificationPreferences(
    client,
    userId,
    preferences,
  );

  return jsonResponse({ preferences: updatedPreferences });
}

function parseCursor(url: URL) {
  const value = url.searchParams.get("cursor");
  return value && value.trim().length > 0 ? value : undefined;
}

function parseLimit(url: URL) {
  const value = url.searchParams.get("limit");
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

async function parseNotificationPreferencesBody(
  request: Request,
): Promise<Pick<NotificationPreferences, "channels" | "events" | "timingPresets"> | null> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const channels =
    record.channels && typeof record.channels === "object"
      ? (record.channels as Record<string, unknown>)
      : null;
  const events =
    record.events && typeof record.events === "object"
      ? (record.events as Record<string, unknown>)
      : null;
  const timingPresets = Array.isArray(record.timingPresets)
    ? record.timingPresets.flatMap((value) => parseTimingPreset(value))
    : null;

  if (
    !channels ||
    !events ||
    typeof channels.inApp !== "boolean" ||
    typeof channels.push !== "boolean" ||
    typeof events.releaseDateChanged !== "boolean" ||
    typeof events.releaseApproaching !== "boolean" ||
    !timingPresets
  ) {
    return null;
  }

  return {
    channels: {
      inApp: channels.inApp,
      push: channels.push,
    },
    events: {
      releaseDateChanged: events.releaseDateChanged,
      releaseApproaching: events.releaseApproaching,
    },
    timingPresets,
  };
}

function parseTimingPreset(value: unknown) {
  switch (value) {
    case "on_day":
    case "hours_24_before":
    case "days_7_before":
    case "days_30_before":
      return [value];
    default:
      return [];
  }
}
