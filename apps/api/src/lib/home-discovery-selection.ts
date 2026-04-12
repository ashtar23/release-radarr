import type { TitleSummary } from "@repo/types";

import type { HomeDiscoveryResult } from "./contracts";
import {
  getHomeDiscoveryDedupeKey,
  isYearEndPlaceholderDate,
  LATEST_MIN_ADDED,
  LATEST_MIN_RATINGS,
  LATEST_MIN_REVIEWS,
  LATEST_MIN_SUGGESTIONS,
  POPULAR_MIN_ADDED,
  POPULAR_PLACEHOLDER_MIN_ADDED,
  POPULAR_PLACEHOLDER_MIN_RATINGS,
  POPULAR_PLACEHOLDER_MIN_SUGGESTIONS,
  POPULAR_MIN_RATINGS,
  POPULAR_MIN_SUGGESTIONS,
  UPCOMING_MIN_ADDED,
  UPCOMING_PLACEHOLDER_MIN_ADDED,
  UPCOMING_PLACEHOLDER_MIN_RATINGS,
  UPCOMING_PLACEHOLDER_MIN_SUGGESTIONS,
  UPCOMING_MIN_RATINGS,
  UPCOMING_MIN_SUGGESTIONS,
} from "./home-discovery-quality";

const DAYS_IN_YEAR = 365;

export function selectHomeDiscoveryRails(params: {
  upcomingCandidates: TitleSummary[];
  latestCandidates: TitleSummary[];
  popularCandidates: TitleSummary[];
  todayIsoDate: string;
  limit: number;
}): HomeDiscoveryResult {
  const usedIds = new Set<string>();

  const upcoming = pickTitles({
    candidates: params.upcomingCandidates,
    limit: params.limit,
    usedIds,
    isEligible: (title) => isUpcomingEligible(title, params.todayIsoDate),
    getScore: (title) => scoreUpcomingTitle(title, params.todayIsoDate),
  });
  const latest = pickTitles({
    candidates: params.latestCandidates,
    limit: params.limit,
    usedIds,
    isEligible: (title) => isLatestEligible(title, params.todayIsoDate),
    getScore: (title) => scoreLatestTitle(title, params.todayIsoDate),
  });
  const popular = pickTitles({
    candidates: params.popularCandidates,
    limit: params.limit,
    usedIds,
    isEligible: (title) => isPopularEligible(title, params.todayIsoDate),
    getScore: (title) => scorePopularTitle(title, params.todayIsoDate),
  });

  return {
    upcoming,
    latest,
    popular,
  };
}

function pickTitles(params: {
  candidates: TitleSummary[];
  limit: number;
  usedIds: Set<string>;
  isEligible: (title: TitleSummary) => boolean;
  getScore: (title: TitleSummary) => number;
}) {
  const ranked = params.candidates
    .filter((title) => !params.usedIds.has(title.id))
    .filter(params.isEligible)
    .map((title, index) => ({
      title,
      score: params.getScore(title),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const leftReleaseDate = left.title.earliestReleaseDate ?? "";
      const rightReleaseDate = right.title.earliestReleaseDate ?? "";
      if (leftReleaseDate !== rightReleaseDate) {
        return leftReleaseDate.localeCompare(rightReleaseDate);
      }

      return left.index - right.index;
    })
    .map((entry) => entry.title);

  const deduped: TitleSummary[] = [];
  const usedKeys = new Set<string>();

  for (const title of ranked) {
    const dedupeKey = getHomeDiscoveryDedupeKey(title.name);
    if (!dedupeKey || usedKeys.has(dedupeKey)) {
      continue;
    }

    usedKeys.add(dedupeKey);
    deduped.push(title);

    if (deduped.length >= params.limit) {
      break;
    }
  }

  for (const title of deduped) {
    params.usedIds.add(title.id);
  }

  return deduped;
}

function isUpcomingEligible(title: TitleSummary, todayIsoDate: string) {
  return (
    isDisplayReady(title) &&
    isOnOrAfter(title.earliestReleaseDate, todayIsoDate) &&
    isAllowedUpcomingPlaceholder(title) &&
    hasUpcomingInterest(title)
  );
}

function isLatestEligible(title: TitleSummary, todayIsoDate: string) {
  return (
    isDisplayReady(title) &&
    isOnOrBefore(title.earliestReleaseDate, todayIsoDate) &&
    hasLatestInterest(title)
  );
}

function isPopularEligible(title: TitleSummary, todayIsoDate: string) {
  return (
    isDisplayReady(title) &&
    isOnOrAfter(title.earliestReleaseDate, addDaysIso(todayIsoDate, -30)) &&
    isAllowedPopularPlaceholder(title) &&
    hasPopularInterest(title)
  );
}

function scoreUpcomingTitle(title: TitleSummary, todayIsoDate: string) {
  const daysUntilRelease = clampNonNegative(
    diffDays(todayIsoDate, title.earliestReleaseDate),
  );
  const placeholderPenalty = isYearEndPlaceholderDate(title.earliestReleaseDate)
    ? 250
    : 0;

  return (
    (DAYS_IN_YEAR - Math.min(daysUntilRelease, DAYS_IN_YEAR)) * 10 +
    numberOrZero(title.rawgAdded) * 2 +
    numberOrZero(title.rawgSuggestionsCount) * 3 +
    numberOrZero(title.rawgRatingsCount) * 4 -
    placeholderPenalty
  );
}

function scoreLatestTitle(title: TitleSummary, todayIsoDate: string) {
  const daysSinceRelease = clampNonNegative(
    diffDays(title.earliestReleaseDate, todayIsoDate),
  );

  return (
    (LATEST_MIN_ADDED + 45 - Math.min(daysSinceRelease, 45)) * 10 +
    numberOrZero(title.rawgAdded) * 2 +
    numberOrZero(title.rawgReviewsCount) * 8 +
    numberOrZero(title.rawgSuggestionsCount) * 3
  );
}

function scorePopularTitle(title: TitleSummary, todayIsoDate: string) {
  const releaseDistance = Math.abs(
    diffDays(todayIsoDate, title.earliestReleaseDate),
  );
  const placeholderPenalty = isYearEndPlaceholderDate(title.earliestReleaseDate)
    ? 300
    : 0;

  return (
    numberOrZero(title.rawgAdded) * 3 +
    numberOrZero(title.rawgRatingsCount) * 6 +
    numberOrZero(title.rawgSuggestionsCount) * 2 +
    numberOrZero(title.rawgMetacritic) * 5 +
    Math.max(0, 365 - Math.min(releaseDistance, 365)) -
    placeholderPenalty
  );
}

function isDisplayReady(title: TitleSummary) {
  return Boolean(title.coverImageUrl) && title.platforms.length > 0;
}

function hasUpcomingInterest(title: TitleSummary) {
  return (
    numberOrZero(title.rawgAdded) >= UPCOMING_MIN_ADDED ||
    numberOrZero(title.rawgSuggestionsCount) >= UPCOMING_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= UPCOMING_MIN_RATINGS
  );
}

function isAllowedUpcomingPlaceholder(title: TitleSummary) {
  if (!isYearEndPlaceholderDate(title.earliestReleaseDate)) {
    return true;
  }

  return (
    numberOrZero(title.rawgAdded) >= UPCOMING_PLACEHOLDER_MIN_ADDED ||
    numberOrZero(title.rawgSuggestionsCount) >=
      UPCOMING_PLACEHOLDER_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= UPCOMING_PLACEHOLDER_MIN_RATINGS
  );
}

function hasLatestInterest(title: TitleSummary) {
  return (
    numberOrZero(title.rawgAdded) >= LATEST_MIN_ADDED ||
    numberOrZero(title.rawgReviewsCount) >= LATEST_MIN_REVIEWS ||
    numberOrZero(title.rawgSuggestionsCount) >= LATEST_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= LATEST_MIN_RATINGS
  );
}

function hasPopularInterest(title: TitleSummary) {
  return (
    numberOrZero(title.rawgAdded) >= POPULAR_MIN_ADDED ||
    numberOrZero(title.rawgSuggestionsCount) >= POPULAR_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= POPULAR_MIN_RATINGS
  );
}

function isAllowedPopularPlaceholder(title: TitleSummary) {
  if (!isYearEndPlaceholderDate(title.earliestReleaseDate)) {
    return true;
  }

  return (
    numberOrZero(title.rawgAdded) >= POPULAR_PLACEHOLDER_MIN_ADDED ||
    numberOrZero(title.rawgSuggestionsCount) >=
      POPULAR_PLACEHOLDER_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= POPULAR_PLACEHOLDER_MIN_RATINGS
  );
}

function numberOrZero(value: number | null) {
  return value ?? 0;
}

function isOnOrAfter(date: string | null, threshold: string) {
  return typeof date === "string" && date >= threshold;
}

function isOnOrBefore(date: string | null, threshold: string) {
  return typeof date === "string" && date <= threshold;
}

function diffDays(startIsoDate: string | null, endIsoDate: string | null) {
  if (!startIsoDate || !endIsoDate) {
    return DAYS_IN_YEAR;
  }

  const start = new Date(`${startIsoDate}T00:00:00.000Z`);
  const end = new Date(`${endIsoDate}T00:00:00.000Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function addDaysIso(isoDate: string, days: number) {
  const value = new Date(`${isoDate}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function clampNonNegative(value: number) {
  return value < 0 ? 0 : value;
}
