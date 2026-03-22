import { DEFAULT_LIMIT } from "../config.ts";
import type {
  CachedTitleRow,
  DbJson,
  ReleaseDatePrecision,
  TitleSummary,
} from "../types.ts";

export function toDbJson(value: unknown): DbJson {
  return value as DbJson;
}

export function assertTitleKind(
  value: string,
): asserts value is TitleSummary["kind"] {
  if (value !== "game") {
    throw new Error(`Unsupported title kind: ${value}`);
  }
}

export function assertTitleSource(
  value: string,
): asserts value is TitleSummary["source"] {
  if (value !== "rawg") {
    throw new Error(`Unsupported title source: ${value}`);
  }
}

export function toReleasePrecision(value: unknown): ReleaseDatePrecision {
  if (value === "day" || value === "month" || value === "year") {
    return value;
  }
  return "unknown";
}

export function extractRawgExternalId(
  titleId: string,
  row: CachedTitleRow | null,
) {
  if (row?.source === "rawg") {
    return row.external_id;
  }

  if (!titleId.startsWith("rawg:")) {
    return null;
  }

  return titleId.slice("rawg:".length);
}

export function normalizeIsoDate(value: string | null) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function clampLimit(value: string | null) {
  if (!value) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, 25);
}

export function clampPage(value: string | null) {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
