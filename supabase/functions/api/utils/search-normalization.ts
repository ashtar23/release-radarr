const SEARCH_PHRASE_ALIASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bspiderman\b/g, replacement: "spider man" },
];

export function normalizeSearchKey(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/([a-z0-9])['’]s\b/g, "$1s")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return SEARCH_PHRASE_ALIASES.reduce(
    (current, alias) => current.replace(alias.pattern, alias.replacement),
    normalized,
  ).replace(/\s+/g, " ").trim();
}

export function tokenizeSearchKey(value: string) {
  const normalized = normalizeSearchKey(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map(toCanonicalToken)
    .filter((token) => token.length > 0);
}

export function toCanonicalSearchKey(value: string) {
  return tokenizeSearchKey(value).join(" ");
}

export function expandNormalizedQueryVariants(query: string) {
  const normalized = normalizeSearchKey(query);
  if (!normalized) {
    return [];
  }

  return [normalized];
}

export function toLooseComparableTokens(tokens: string[]) {
  return tokens
    .filter((token) => token !== "s")
    .map((token) => {
      if (token.length > 5 && token.endsWith("s") && !token.endsWith("ss")) {
        return token.slice(0, -1);
      }

      return token;
    })
    .filter((token) => token.length > 0);
}

function toCanonicalToken(token: string) {
  if (/^[0-9]+$/.test(token)) {
    return token;
  }

  const romanAsNumber = romanNumeralToNumber(token);
  if (romanAsNumber !== null) {
    return String(romanAsNumber);
  }

  return token;
}

function romanNumeralToNumber(value: string) {
  const romanMap: Record<string, number> = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
    xiii: 13,
    xiv: 14,
    xv: 15,
    xvi: 16,
    xvii: 17,
    xviii: 18,
    xix: 19,
    xx: 20,
  };

  return romanMap[value] ?? null;
}
