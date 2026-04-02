export const NOTIFICATION_EVENT_TYPE_VALUES = [
  "release_date_changed",
  "release_approaching",
] as const;

export const NOTIFICATION_TIMING_PRESET_VALUES = [
  "on_day",
  "hours_24_before",
  "days_7_before",
  "days_30_before",
] as const;

export const NOTIFICATION_DESTINATION_KIND_VALUES = ["title"] as const;

export const NOTIFICATION_EVENT_VERSION = 1 as const;
