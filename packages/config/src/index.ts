import type { NotificationEventType } from "@repo/types";

export const APP_NAME = "Release Radar";

export const API_PATH_PREFIX = "/functions/v1/api";

export const MVP_NOTIFICATION_EVENT_TYPES = [
  "release_date_changed",
  "release_approaching",
] as const satisfies readonly NotificationEventType[];

export const SUPABASE_WEB_ENV = {
  url: "VITE_SUPABASE_URL",
  anonKey: "VITE_SUPABASE_ANON_KEY",
} as const;

export const SUPABASE_MOBILE_ENV = {
  url: "EXPO_PUBLIC_SUPABASE_URL",
  anonKey: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
} as const;
