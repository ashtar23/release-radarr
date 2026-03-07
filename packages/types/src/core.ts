export type EntityId = string;

export type ExternalId = string;

export type IsoDateString = string;

export type IsoDateTimeString = string;

export type ContentKind = "game";

export type SourceProvider = "rawg";

export interface HealthStatus {
  ok: true;
  checkedAt: IsoDateTimeString;
}
