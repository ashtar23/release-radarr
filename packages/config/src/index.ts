import type { NotificationEventType } from "@repo/types";

export const APP_NAME = "Release Radar";

export const API_PATH_PREFIX = "/functions/v1/api";

export const MVP_NOTIFICATION_EVENT_TYPES = [
  "release_date_changed",
  "release_approaching",
] as const satisfies readonly NotificationEventType[];
