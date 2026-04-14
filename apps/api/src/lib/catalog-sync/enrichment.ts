import type { TitleSummary } from "@repo/types";

export function selectCatalogEnrichmentCandidates(params: {
  summaries: TitleSummary[];
  limit: number;
}) {
  if (params.limit <= 0) {
    return [];
  }

  return [...params.summaries]
    .sort((left, right) => {
      const scoreDifference =
        getCatalogEnrichmentPriority(right) -
        getCatalogEnrichmentPriority(left);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, params.limit);
}

function getCatalogEnrichmentPriority(summary: TitleSummary) {
  const futureBoost = isFutureRelease(summary.earliestReleaseDate) ? 400 : 0;
  const platformBoost = summary.platforms.length > 0 ? 80 : 0;
  const coverBoost = summary.coverImageUrl ? 40 : 0;

  return (
    futureBoost +
    platformBoost +
    coverBoost +
    (summary.rawgAdded ?? 0) +
    (summary.rawgRatingsCount ?? 0) * 4 +
    (summary.rawgReviewsCount ?? 0) * 2 +
    (summary.rawgMetacritic ?? 0) * 8
  );
}

function isFutureRelease(value: string | null) {
  if (!value) {
    return false;
  }

  const releaseDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(releaseDate.getTime())) {
    return false;
  }

  return releaseDate.getTime() > Date.now();
}
