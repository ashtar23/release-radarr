import type { EntityId, IsoDateString, IsoDateTimeString } from "./core";

export const notificationEventTypeValues = [
  "release_date_changed",
  "release_approaching",
] as const;

export type NotificationEventType =
  (typeof notificationEventTypeValues)[number];

export const notificationTimingPresetValues = [
  "on_day",
  "hours_24_before",
  "days_7_before",
  "days_30_before",
] as const;

export type NotificationTimingPreset =
  (typeof notificationTimingPresetValues)[number];

export const notificationDestinationKindValues = ["title"] as const;

export type NotificationDestinationKind =
  (typeof notificationDestinationKindValues)[number];

export interface NotificationChannelPreferences {
  inApp: boolean;
  push: boolean;
}

export interface NotificationEventPreferences {
  releaseDateChanged: boolean;
  releaseApproaching: boolean;
}

export interface NotificationPreferences {
  channels: NotificationChannelPreferences;
  events: NotificationEventPreferences;
  timingPresets: NotificationTimingPreset[];
  updatedAt: IsoDateTimeString;
}

export interface NotificationPreferencesResult {
  preferences: NotificationPreferences;
}

export interface UpdateNotificationPreferencesInput {
  channels: NotificationChannelPreferences;
  events: NotificationEventPreferences;
  timingPresets: NotificationTimingPreset[];
}

export interface ReleaseDateChangedNotificationPayload {
  previousReleaseDate: IsoDateString | null;
  nextReleaseDate: IsoDateString | null;
}

export interface ReleaseApproachingNotificationPayload {
  targetReleaseDate: IsoDateString | null;
  timingPreset: NotificationTimingPreset;
}

export type NotificationPayload =
  | ReleaseDateChangedNotificationPayload
  | ReleaseApproachingNotificationPayload;

export interface NotificationRecord {
  id: EntityId;
  titleId: EntityId;
  eventType: NotificationEventType;
  destinationKind: NotificationDestinationKind;
  destinationTitleId: EntityId;
  titleName: string;
  titleArtworkUrl: string | null;
  message: string;
  subtitle: string | null;
  payload: NotificationPayload;
  createdAt: IsoDateTimeString;
  readAt: IsoDateTimeString | null;
}

export interface NotificationRecordListResult {
  items: NotificationRecord[];
  nextCursor: string | null;
}

export interface NotificationUnreadCountResult {
  unreadCount: number;
}

export interface ListNotificationsInput {
  cursor?: string;
  limit?: number;
}

export interface MarkNotificationReadInput {
  notificationId: EntityId;
}

export interface MarkNotificationReadResult {
  notification: NotificationRecord;
}

export interface MarkAllNotificationsReadResult {
  markedCount: number;
}
