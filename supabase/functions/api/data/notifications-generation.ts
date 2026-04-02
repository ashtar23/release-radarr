import type {
  AdminClient,
  NotificationEventType,
  NotificationPayload,
} from "../types.ts";
import {
  listNotificationAudienceForTitle,
  shouldDeliverNotificationEvent,
  upsertNotificationEvent,
  upsertNotificationRecord,
} from "./notifications-repository.ts";
import { NOTIFICATION_EVENT_VERSION } from "../contracts/notifications.ts";

export interface EmitNotificationEventParams {
  readonly titleId: string;
  readonly titleName: string;
  readonly titleArtworkUrl: string | null;
  readonly eventType: NotificationEventType;
  readonly eventKey: string;
  readonly occurredAt: string;
  readonly payload: NotificationPayload;
  readonly message: string;
  readonly subtitle?: string | null;
}

export interface EmitNotificationEventResult {
  readonly eventId: string;
  readonly deliveredUserIds: string[];
  readonly skippedUserIds: string[];
}

export async function emitNotificationEventAndFanOut(
  client: AdminClient,
  params: EmitNotificationEventParams,
): Promise<EmitNotificationEventResult> {
  const event = await upsertNotificationEvent(client, {
    id: buildNotificationEventId(params.eventKey),
    titleId: params.titleId,
    eventType: params.eventType,
    eventVersion: NOTIFICATION_EVENT_VERSION,
    eventKey: params.eventKey,
    occurredAt: params.occurredAt,
    payload: params.payload,
  });

  const audience = await listNotificationAudienceForTitle(
    client,
    params.titleId,
  );
  const deliveredUserIds: string[] = [];
  const skippedUserIds: string[] = [];

  for (const member of audience) {
    if (!shouldDeliverNotificationEvent(member.preferences, params.eventType)) {
      skippedUserIds.push(member.userId);
      continue;
    }

    await upsertNotificationRecord(client, {
      id: buildNotificationRecordId(event.id, member.userId),
      userId: member.userId,
      eventId: event.id,
      titleId: params.titleId,
      eventType: params.eventType,
      destinationKind: "title",
      destinationTitleId: params.titleId,
      titleName: params.titleName,
      titleArtworkUrl: params.titleArtworkUrl,
      message: params.message,
      subtitle: params.subtitle ?? null,
      payload: params.payload,
      createdAt: params.occurredAt,
    });

    deliveredUserIds.push(member.userId);
  }

  return {
    eventId: event.id,
    deliveredUserIds,
    skippedUserIds,
  };
}

function buildNotificationEventId(eventKey: string) {
  return `notification-event:${eventKey}`;
}

function buildNotificationRecordId(eventId: string, userId: string) {
  return `notification-record:${eventId}:${userId}`;
}
