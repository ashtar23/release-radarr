import { evaluateSearchFallbackPolicy } from "./search-fallback-policy.ts";

Deno.test("returns local-only policy when local page is sufficient and fresh", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 20,
    localTotalCount: 100,
    staleRatio: 0.1,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (!policy.sufficientLocal) throw new Error("expected sufficientLocal=true");
  if (!policy.freshLocal) throw new Error("expected freshLocal=true");
  if (policy.needsProvider) throw new Error("expected needsProvider=false");
});

Deno.test("returns local-only when broad page is complete and healthy above sparse threshold", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 8,
    localTotalCount: 8,
    staleRatio: 0.1,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (!policy.sufficientLocal) throw new Error("expected sufficientLocal=true");
  if (!policy.freshLocal) throw new Error("expected freshLocal=true");
  if (policy.needsProvider) throw new Error("expected needsProvider=false");
});

Deno.test("requires provider when local page coverage is weak", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 6,
    localTotalCount: 100,
    staleRatio: 0,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (policy.sufficientLocal) throw new Error("expected sufficientLocal=false");
  if (!policy.freshLocal) throw new Error("expected freshLocal=true");
  if (!policy.needsProvider) throw new Error("expected needsProvider=true");
});

Deno.test("requires provider when local page is complete but total local results are sparse", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 3,
    localTotalCount: 3,
    staleRatio: 0,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (policy.sufficientLocal) throw new Error("expected sufficientLocal=false");
  if (!policy.freshLocal) throw new Error("expected freshLocal=true");
  if (!policy.needsProvider) throw new Error("expected needsProvider=true");
});

Deno.test("allows local-only when local page is complete and sparse threshold is disabled", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 3,
    localTotalCount: 3,
    staleRatio: 0,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 1,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (!policy.sufficientLocal) throw new Error("expected sufficientLocal=true");
  if (!policy.freshLocal) throw new Error("expected freshLocal=true");
  if (policy.needsProvider) throw new Error("expected needsProvider=false");
});

Deno.test("requires provider when local page is stale", () => {
  const policy = evaluateSearchFallbackPolicy({
    localPageCount: 20,
    localTotalCount: 100,
    staleRatio: 0.9,
    page: 1,
    limit: 20,
    minLocalResultsBeforeFallback: 5,
    minLocalPageCoverage: 0.8,
    maxStaleRatio: 0.3,
  });

  if (!policy.sufficientLocal) throw new Error("expected sufficientLocal=true");
  if (policy.freshLocal) throw new Error("expected freshLocal=false");
  if (!policy.needsProvider) throw new Error("expected needsProvider=true");
});
