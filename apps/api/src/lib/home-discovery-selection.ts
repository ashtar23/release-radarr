import type { TitleSummary } from "@repo/types";

import type { HomeDiscoveryResult } from "./contracts";

const DAYS_IN_YEAR = 365;
const UPCOMING_MIN_ADDED = 10;
const UPCOMING_MIN_SUGGESTIONS = 40;
const UPCOMING_MIN_RATINGS = 3;
const LATEST_MIN_ADDED = 8;
const LATEST_MIN_REVIEWS = 2;
const LATEST_MIN_SUGGESTIONS = 15;
const POPULAR_MIN_ADDED = 25;
const POPULAR_MIN_SUGGESTIONS = 50;
const POPULAR_MIN_RATINGS = 5;

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
    .slice(0, params.limit)
    .map((entry) => entry.title);

  for (const title of ranked) {
    params.usedIds.add(title.id);
  }

  return ranked;
}

function isUpcomingEligible(title: TitleSummary, todayIsoDate: string) {
  return (
    isDisplayReady(title) &&
    isOnOrAfter(title.earliestReleaseDate, todayIsoDate) &&
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
    hasPopularInterest(title)
  );
}

function scoreUpcomingTitle(title: TitleSummary, todayIsoDate: string) {
  const daysUntilRelease = clampNonNegative(
    diffDays(todayIsoDate, title.earliestReleaseDate),
  );

  return (
    (DAYS_IN_YEAR - Math.min(daysUntilRelease, DAYS_IN_YEAR)) * 10 +
    numberOrZero(title.rawgAdded) * 2 +
    numberOrZero(title.rawgSuggestionsCount) * 3 +
    numberOrZero(title.rawgRatingsCount) * 4
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

  return (
    numberOrZero(title.rawgAdded) * 3 +
    numberOrZero(title.rawgRatingsCount) * 6 +
    numberOrZero(title.rawgSuggestionsCount) * 2 +
    numberOrZero(title.rawgMetacritic) * 5 +
    Math.max(0, 365 - Math.min(releaseDistance, 365))
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

function hasLatestInterest(title: TitleSummary) {
  return (
    numberOrZero(title.rawgAdded) >= LATEST_MIN_ADDED ||
    numberOrZero(title.rawgReviewsCount) >= LATEST_MIN_REVIEWS ||
    numberOrZero(title.rawgSuggestionsCount) >= LATEST_MIN_SUGGESTIONS
  );
}

function hasPopularInterest(title: TitleSummary) {
  return (
    numberOrZero(title.rawgAdded) >= POPULAR_MIN_ADDED ||
    numberOrZero(title.rawgSuggestionsCount) >= POPULAR_MIN_SUGGESTIONS ||
    numberOrZero(title.rawgRatingsCount) >= POPULAR_MIN_RATINGS
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
