export const DEFAULT_LIMIT = 20;
export const DEFAULT_PAGE = 1;
export const MAX_LIMIT = 25;
export const MIN_QUERY_LENGTH = 2;
export const MIN_LOCAL_CANDIDATES = 120;
export const MAX_LOCAL_CANDIDATES = 1000;
export const MAX_PROVIDER_PAGES = 3;
export const PROVIDER_DETAIL_ENRICHMENT_LIMIT = 5;
export const BROAD_LOW_QUALITY_THRESHOLD = 0.16;
export const STRONG_COVERAGE_THRESHOLD = 0.66;

export const TRUSTED_DEVELOPERS = new Set([
  "insomniac games",
  "santa monica studio",
  "naughty dog",
  "fromsoftware",
  "rockstar games",
  "cd projekt red",
  "valve",
  "remedy entertainment",
  "larian studios",
  "kojima productions",
  "capcom",
]);

export const TRUSTED_PUBLISHERS = new Set([
  "sony interactive entertainment",
  "playstation publishing llc",
  "xbox game studios",
  "nintendo",
  "bethesda softworks",
  "rockstar games",
  "capcom",
  "square enix",
  "bandai namco entertainment",
  "activision",
  "electronic arts",
  "sega",
]);

export const NOISE_KEYWORD_PENALTIES = [
  { keyword: "demo", points: -260 },
  { keyword: "leaked", points: -320 },
  { keyword: "mod", points: -220 },
  { keyword: "fan", points: -180 },
  { keyword: "test", points: -140 },
  { keyword: "prototype", points: -200 },
  { keyword: "simulator", points: -280 },
  { keyword: "demake", points: -260 },
  { keyword: "fangame", points: -240 },
  { keyword: "android", points: -180 },
] as const;

export const PARENTHETICAL_NOISE_TOKENS = new Set([
  "arcade",
  "browser",
  "clicker",
  "demo",
  "fan",
  "fangame",
  "mod",
  "prototype",
  "simulator",
  "test",
  "vr",
]);

export const EDITION_TERMS = [
  "game of the year",
  "goty",
  "complete edition",
  "definitive edition",
  "ultimate edition",
  "deluxe edition",
  "director cut",
  "directors cut",
  "remastered",
  "remaster",
  "bundle",
  "collection",
  "trilogy",
  "enhanced edition",
] as const;

export const SEARCH_PHRASE_ALIASES: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  { pattern: /\bspiderman\b/g, replacement: "spider man" },
  { pattern: /\bgow\b/g, replacement: "god of war" },
];

export const SEARCH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);
