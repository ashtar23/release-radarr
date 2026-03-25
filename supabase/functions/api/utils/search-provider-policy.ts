import {
  getSearchMaxStaleRatio,
  getSearchMinLocalPageCoverage,
  getSearchMinLocalPageCoverageBroadPageOne,
  getSearchMinLocalResultsBeforeFallback,
} from "../config.ts";
import type {
  QueryIntentMode,
  SearchDecisionReason,
  SearchProviderUsedTrigger,
} from "../contracts/search.ts";
import type { SearchFallbackPolicy } from "./search-fallback-policy.ts";

const SPARSE_BROAD_PROVIDER_MAX_PAGES = 3;

export function getMinLocalResultsBeforeFallback(
  intentMode: QueryIntentMode,
  page: number,
) {
  const minLocalResultsBeforeFallback =
    getSearchMinLocalResultsBeforeFallback();
  return intentMode === "broad" && page === 1
    ? minLocalResultsBeforeFallback
    : 1;
}

export function getMinLocalPageCoverage(
  intentMode: QueryIntentMode,
  page: number,
) {
  return intentMode === "broad" && page === 1
    ? getSearchMinLocalPageCoverageBroadPageOne()
    : getSearchMinLocalPageCoverage();
}

export function isSparseBroadFirstPageLocal(
  intentMode: QueryIntentMode,
  page: number,
  visibleLocalPageCount: number,
  localTotalCount: number,
  hasProtectedBroadLocalHead: boolean,
) {
  const minLocalResultsBeforeFallback =
    getSearchMinLocalResultsBeforeFallback();
  if (intentMode !== "broad" || page !== 1) {
    return false;
  }

  if (hasProtectedBroadLocalHead) {
    return false;
  }

  const sparseVisiblePage =
    visibleLocalPageCount < minLocalResultsBeforeFallback;
  const sparseLocalTotal = localTotalCount < minLocalResultsBeforeFallback;

  return sparseVisiblePage || sparseLocalTotal;
}

export function getProviderPageBudget(sparseBroadFirstPageLocal: boolean) {
  return sparseBroadFirstPageLocal ? SPARSE_BROAD_PROVIDER_MAX_PAGES : 1;
}

export function getProviderDecisionReason(
  forceRefresh: boolean,
  sparseBroadFirstPageLocal: boolean,
): SearchDecisionReason {
  if (forceRefresh) {
    return "forced_refresh";
  }

  if (sparseBroadFirstPageLocal) {
    return "sparse_broad_local";
  }

  return "provider_used";
}

export function isBroadSparseFreshLocalSufficient(
  intentMode: QueryIntentMode,
  page: number,
  sparseBroadFirstPageLocal: boolean,
  visibleLocalPageCount: number,
  localStaleRatio: number,
) {
  const maxStaleRatio = getSearchMaxStaleRatio();
  if (intentMode !== "broad" || page !== 1) {
    return false;
  }

  if (!sparseBroadFirstPageLocal) {
    return false;
  }

  if (visibleLocalPageCount <= 0) {
    return false;
  }

  if (localStaleRatio <= maxStaleRatio) {
    return true;
  }

  // Tiny sparse pages are unstable under ratio-only freshness checks.
  // Allow one stale item when we have at least 3 visible local results.
  const estimatedStaleCount = Math.round(
    localStaleRatio * visibleLocalPageCount,
  );
  const sparseStaleBudget = visibleLocalPageCount >= 3 ? 1 : 0;
  return estimatedStaleCount <= sparseStaleBudget;
}

export function shouldServeLocalResults(
  forceRefresh: boolean,
  needsProvider: boolean,
  broadProtectedHeadIsFresh: boolean,
  broadSparseFreshLocalSufficient: boolean,
) {
  return (
    !forceRefresh &&
    (!needsProvider ||
      broadProtectedHeadIsFresh ||
      broadSparseFreshLocalSufficient)
  );
}

export function getProviderUsedTrigger(
  policy: SearchFallbackPolicy,
): SearchProviderUsedTrigger | undefined {
  if (!policy.needsProvider) {
    return undefined;
  }

  const insufficientCoverage = !policy.sufficientLocal;
  const staleLocal = !policy.freshLocal;

  if (insufficientCoverage && staleLocal) {
    return "coverage_and_freshness";
  }

  if (insufficientCoverage) {
    return "coverage";
  }

  if (staleLocal) {
    return "freshness";
  }

  return undefined;
}
