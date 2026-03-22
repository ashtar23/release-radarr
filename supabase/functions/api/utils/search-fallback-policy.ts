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
  minLocalPageCoverage: number;
  maxStaleRatio: number;
}

export function evaluateSearchFallbackPolicy(
  params: EvaluateSearchFallbackPolicyParams,
): SearchFallbackPolicy {
  const pageStart = (params.page - 1) * params.limit;
  const localPageComplete = pageStart + params.localPageCount >= params.localTotalCount;
  const localCoverage =
    params.limit > 0 ? Math.min(params.localPageCount / params.limit, 1) : 0;
  const sufficientLocal =
    localPageComplete ||
    (params.localPageCount > 0 && localCoverage >= params.minLocalPageCoverage);
  const freshLocal = params.staleRatio <= params.maxStaleRatio;

  return {
    sufficientLocal,
    freshLocal,
    needsProvider: !sufficientLocal || !freshLocal,
  };
}
