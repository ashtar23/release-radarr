export interface SearchFallbackPolicy {
  sufficientLocal: boolean;
  freshLocal: boolean;
  needsProvider: boolean;
}

interface EvaluateSearchFallbackPolicyParams {
  localPageCount: number;
  localTotalCount: number;
  staleRatio: number;
  page: number;
  limit: number;
  minLocalResultsBeforeFallback: number;
  minLocalPageCoverage: number;
  maxStaleRatio: number;
}

export function evaluateSearchFallbackPolicy(
  params: EvaluateSearchFallbackPolicyParams,
): SearchFallbackPolicy {
  const pageStart = (params.page - 1) * params.limit;
  const localPageComplete =
    pageStart + params.localPageCount >= params.localTotalCount;
  const hasEnoughLocalTotalResults =
    params.localTotalCount >= params.minLocalResultsBeforeFallback;
  const localCoverage =
    params.limit > 0 ? Math.min(params.localPageCount / params.limit, 1) : 0;
  const hasEnoughLocalPageResults =
    params.localPageCount >= params.minLocalResultsBeforeFallback;
  const sufficientLocal =
    (localPageComplete && hasEnoughLocalTotalResults) ||
    (hasEnoughLocalPageResults && localCoverage >= params.minLocalPageCoverage);
  const freshLocal = params.staleRatio <= params.maxStaleRatio;

  return {
    sufficientLocal,
    freshLocal,
    needsProvider: !sufficientLocal || !freshLocal,
  };
}
