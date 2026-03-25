import {
  parseSearchTimingLogs,
  summarizeTimingLogs,
} from "./search-timing-summary.ts";

Deno.test("parseSearchTimingLogs extracts only valid timing lines", () => {
  const raw = [
    'INFO something else {"ignored":true}',
    '[search-timing] {"query":"zelda","page":1,"limit":20,"servedBy":"local-cache","requestMs":10,"localFetchMs":3,"localCountMs":2,"rankMs":4,"providerFetchMs":0,"upsertMs":0,"localCountMode":"exact","localCountFallbackUsed":false}',
    "[search-timing] not-json",
    '[search-timing] {"query":"witcher","page":1,"limit":20,"servedBy":"rawg-refresh","requestMs":55.2,"localFetchMs":8,"localCountMs":12,"rankMs":6,"providerFetchMs":28,"upsertMs":9,"localCountMode":"planned","localCountFallbackUsed":false}',
  ].join("\n");

  const entries = parseSearchTimingLogs(raw);
  if (entries.length !== 2) {
    throw new Error(`Expected 2 valid entries, got ${entries.length}`);
  }

  if (
    entries[0]?.servedBy !== "local-cache" ||
    entries[1]?.servedBy !== "rawg-refresh"
  ) {
    throw new Error("Expected servedBy values to be parsed correctly.");
  }
});

Deno.test("summarizeTimingLogs computes avg and percentiles", () => {
  const entries = parseSearchTimingLogs([
    '[search-timing] {"query":"a","page":1,"limit":20,"servedBy":"local-cache","requestMs":10,"localFetchMs":2,"localCountMs":1,"rankMs":3,"providerFetchMs":0,"upsertMs":0,"localCountMode":"exact","localCountFallbackUsed":false}',
    '[search-timing] {"query":"b","page":1,"limit":20,"servedBy":"local-cache","requestMs":20,"localFetchMs":4,"localCountMs":1,"rankMs":5,"providerFetchMs":0,"upsertMs":0,"localCountMode":"exact","localCountFallbackUsed":false}',
    '[search-timing] {"query":"c","page":1,"limit":20,"servedBy":"rawg-refresh","requestMs":30,"localFetchMs":6,"localCountMs":2,"rankMs":7,"providerFetchMs":8,"upsertMs":9,"localCountMode":"planned","localCountFallbackUsed":false}',
  ].join("\n"));

  const summary = summarizeTimingLogs(entries);
  if (summary.requestMs.avg !== 20) {
    throw new Error(`Expected request avg of 20, got ${summary.requestMs.avg}`);
  }

  if (summary.requestMs.p95 !== 29) {
    throw new Error(`Expected request p95 of 29, got ${summary.requestMs.p95}`);
  }

  if (summary.providerFetchMs.max !== 8) {
    throw new Error(
      `Expected providerFetch max of 8, got ${summary.providerFetchMs.max}`,
    );
  }
});
