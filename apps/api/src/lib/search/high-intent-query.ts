import { NOISE_KEYWORD_PENALTIES } from "./constants";
import {
  getMeaningfulSearchTokens,
  normalizeSearchKey,
  tokenizeSearchKey,
} from "./normalize";

type HighIntentNumericQueryProfile = {
  normalizedQuery: string;
  queryTokens: string[];
  nonNumericTokens: string[];
  numericTokens: string[];
  isHighIntentNumericQuery: boolean;
};

export function getHighIntentNumericQueryProfile(query: string) {
  const normalizedQuery = normalizeSearchKey(query);
  const queryTokens = tokenizeSearchKey(query);
  const meaningfulTokens = getMeaningfulSearchTokens(queryTokens);
  const nonNumericTokens = Array.from(
    new Set(meaningfulTokens.filter((token) => !/^\d+$/.test(token))),
  );
  const numericTokens = Array.from(
    new Set(queryTokens.filter((token) => /^\d+$/.test(token))),
  );

  return {
    normalizedQuery,
    queryTokens,
    nonNumericTokens,
    numericTokens,
    isHighIntentNumericQuery:
      queryTokens.length > 1 &&
      numericTokens.length > 0 &&
      nonNumericTokens.length > 0,
  } satisfies HighIntentNumericQueryProfile;
}

export function isStrongHighIntentNumericMatch(
  name: string,
  profile: HighIntentNumericQueryProfile,
) {
  if (!profile.isHighIntentNumericQuery) {
    return true;
  }

  const normalizedName = normalizeSearchKey(name);
  if (
    normalizedName === profile.normalizedQuery ||
    normalizedName.startsWith(profile.normalizedQuery) ||
    normalizedName.includes(profile.normalizedQuery)
  ) {
    return true;
  }

  const nameTokens = tokenizeSearchKey(name);
  if (profile.numericTokens.some((token) => !nameTokens.includes(token))) {
    return false;
  }

  return profile.nonNumericTokens.some((queryToken) =>
    nameTokens.some((nameToken) =>
      isStrongNonNumericAnchor(queryToken, nameToken),
    ),
  );
}

export function isLowTrustSearchVariant(
  name: string,
  queryTokens: Iterable<string>,
) {
  const normalizedNameTokens = new Set(tokenizeSearchKey(name));
  const queryTokenSet = new Set(queryTokens);

  return NOISE_KEYWORD_PENALTIES.some(
    (penalty) =>
      normalizedNameTokens.has(penalty.keyword) &&
      !queryTokenSet.has(penalty.keyword),
  );
}

function isStrongNonNumericAnchor(queryToken: string, nameToken: string) {
  if (queryToken === nameToken) {
    return true;
  }

  if (queryToken.length < 4 || nameToken.length < queryToken.length) {
    return false;
  }

  if (!nameToken.startsWith(queryToken.slice(0, 4))) {
    return false;
  }

  return getLevenshteinDistance(queryToken, nameToken) <= 1;
}

function getLevenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previous = rows[0] ?? 0;
    rows[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = rows[leftIndex] ?? 0;
      const substitutionCost =
        left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;

      rows[leftIndex] = Math.min(
        (rows[leftIndex - 1] ?? 0) + 1,
        current + 1,
        previous + substitutionCost,
      );
      previous = current;
    }
  }

  return rows[left.length] ?? Math.max(left.length, right.length);
}
