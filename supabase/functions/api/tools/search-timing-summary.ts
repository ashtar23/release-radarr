const SEARCH_TIMING_PREFIX = "[search-timing] ";
const METRIC_KEYS = [
  "requestMs",
  "localFetchMs",
  "localCountMs",
  "rankMs",
  "providerFetchMs",
  "upsertMs",
] as const;

type MetricKey = (typeof METRIC_KEYS)[number];

export interface SearchTimingLog {
  query: string;
  page: number;
  limit: number;
  servedBy: string;
  decisionReason?: string;
  requestMs: number;
  localFetchMs: number;
  localCountMs: number;
  rankMs: number;
  providerFetchMs: number;
  upsertMs: number;
  localCountMode: string;
  localCountFallbackUsed: boolean;
}

interface MetricSummary {
  count: number;
  avg: number;
  p50: number;
  p95: number;
  min: number;
  max: number;
}

export function parseSearchTimingLogs(raw: string): SearchTimingLog[] {
  const entries: SearchTimingLog[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const start = line.indexOf(SEARCH_TIMING_PREFIX);
    if (start < 0) {
      continue;
    }

    const payload = line.slice(start + SEARCH_TIMING_PREFIX.length).trim();
    if (!payload) {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as SearchTimingLog;
      if (typeof parsed.requestMs === "number" && parsed.servedBy) {
        entries.push(parsed);
      }
    } catch {
      // Ignore malformed lines to keep this script resilient in mixed logs.
    }
  }

  return entries;
}

export function summarizeTimingMetric(
  entries: SearchTimingLog[],
  metric: MetricKey,
): MetricSummary {
  const values = entries
    .map((entry) => entry[metric])
    .filter((value): value is number =>
      typeof value === "number" && Number.isFinite(value)
    )
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return {
      count: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      min: 0,
      max: 0,
    };
  }

  const sum = values.reduce((accumulator, value) => accumulator + value, 0);

  return {
    count: values.length,
    avg: round(sum / values.length),
    p50: round(percentile(values, 0.5)),
    p95: round(percentile(values, 0.95)),
    min: round(values[0]),
    max: round(values[values.length - 1]),
  };
}

export function summarizeTimingLogs(entries: SearchTimingLog[]) {
  return Object.fromEntries(
    METRIC_KEYS.map((
      metric,
    ) => [metric, summarizeTimingMetric(entries, metric)]),
  ) as Record<MetricKey, MetricSummary>;
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (sortedValues.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function printSummary(
  label: string,
  entries: SearchTimingLog[],
) {
  console.log(`\n=== ${label} ===`);
  console.log(`entries: ${entries.length}`);

  if (entries.length === 0) {
    console.log("No parseable [search-timing] entries found.");
    return;
  }

  const byServedBy = countBy(entries, (entry) => entry.servedBy);
  console.log(`servedBy: ${JSON.stringify(byServedBy)}`);

  const summary = summarizeTimingLogs(entries);
  for (const metric of METRIC_KEYS) {
    const item = summary[metric];
    console.log(
      `${metric.padEnd(16)} avg=${item.avg.toFixed(2).padStart(8)} ` +
        `p50=${item.p50.toFixed(2).padStart(8)} ` +
        `p95=${item.p95.toFixed(2).padStart(8)} ` +
        `min=${item.min.toFixed(2).padStart(8)} ` +
        `max=${item.max.toFixed(2).padStart(8)}`,
    );
  }
}

function printComparison(
  baselineLabel: string,
  baselineEntries: SearchTimingLog[],
  candidateLabel: string,
  candidateEntries: SearchTimingLog[],
) {
  console.log(
    `\n=== Comparison (${baselineLabel} -> ${candidateLabel}) ===`,
  );

  const baselineSummary = summarizeTimingLogs(baselineEntries);
  const candidateSummary = summarizeTimingLogs(candidateEntries);

  for (const metric of METRIC_KEYS) {
    const baseline = baselineSummary[metric].avg;
    const candidate = candidateSummary[metric].avg;
    const delta = round(candidate - baseline);
    const percent = baseline === 0 ? 0 : round((delta / baseline) * 100);
    const sign = delta >= 0 ? "+" : "";
    console.log(
      `${metric.padEnd(16)} ${baseline.toFixed(2).padStart(8)} -> ${
        candidate.toFixed(2).padStart(8)
      } (${sign}${delta.toFixed(2)}ms, ${sign}${percent.toFixed(2)}%)`,
    );
  }
}

function countBy<T>(items: T[], keySelector: (item: T) => string) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keySelector(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

if (import.meta.main) {
  const [firstPath, secondPath] = Deno.args;
  if (!firstPath) {
    console.error(
      "Usage: deno run supabase/functions/api/tools/search-timing-summary.ts <log-a> [log-b]",
    );
    Deno.exit(1);
  }

  const firstRaw = await Deno.readTextFile(firstPath);
  const firstEntries = parseSearchTimingLogs(firstRaw);
  printSummary(firstPath, firstEntries);

  if (secondPath) {
    const secondRaw = await Deno.readTextFile(secondPath);
    const secondEntries = parseSearchTimingLogs(secondRaw);
    printSummary(secondPath, secondEntries);
    printComparison(firstPath, firstEntries, secondPath, secondEntries);
  }
}
