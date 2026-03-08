import type { IsoDateTimeString } from "./core";

export type NotificationEventType =
  | "release_date_changed"
  | "release_approaching";

export type NotificationTimingPreset =
  | "on_day"
  | "hours_24_before"
  | "days_7_before"
  | "days_30_before";

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
