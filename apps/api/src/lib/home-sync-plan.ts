import type { TitleSummary } from "@repo/types";

const HOME_SYNC_PAGE_SIZE = 40;
const UPCOMING_WINDOW_DAYS = 365;
const RECENT_WINDOW_DAYS = 60;
const POPULAR_WINDOW_PAST_DAYS = 90;
const POPULAR_WINDOW_FUTURE_DAYS = 180;

export type HomeSyncCandidateGroup = {
  readonly key: "upcoming" | "latest" | "popular";
  readonly pageSize: number;
  readonly ordering: string;
  readonly dates: string;
};

export function buildHomeSyncCandidateGroups(
  runDate = toIsoDate(new Date()),
): HomeSyncCandidateGroup[] {
  const baseDate = parseIsoDate(runDate);

  return [
    {
      key: "upcoming",
      pageSize: HOME_SYNC_PAGE_SIZE,
      ordering: "-added",
      dates: createDatesRange(baseDate, 0, UPCOMING_WINDOW_DAYS),
    },
    {
      key: "latest",
      pageSize: HOME_SYNC_PAGE_SIZE,
      ordering: "-released",
      dates: createDatesRange(baseDate, -RECENT_WINDOW_DAYS, 0),
    },
    {
      key: "popular",
      pageSize: HOME_SYNC_PAGE_SIZE,
      ordering: "-added",
      dates: createDatesRange(
        baseDate,
        -POPULAR_WINDOW_PAST_DAYS,
        POPULAR_WINDOW_FUTURE_DAYS,
      ),
    },
  ];
}

export function mergeUniqueTitleSummaries(groups: TitleSummary[][]) {
  const merged = new Map<string, TitleSummary>();

  for (const group of groups) {
    for (const summary of group) {
      if (!merged.has(summary.id)) {
        merged.set(summary.id, summary);
      }
    }
  }

  return Array.from(merged.values());
}

function createDatesRange(
  baseDate: Date,
  startOffsetDays: number,
  endOffsetDays: number,
) {
  return `${toIsoDate(addDays(baseDate, startOffsetDays))},${toIsoDate(
    addDays(baseDate, endOffsetDays),
  )}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid run date "${value}". Expected YYYY-MM-DD.`);
  }

  return parsed;
}
