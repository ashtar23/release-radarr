export type EntityId = string;

export type IsoDateString = string;

export type NotificationEventType =
  | "release_date_changed"
  | "release_approaching";

export interface HealthStatus {
  ok: true;
  checkedAt: IsoDateString;
}
