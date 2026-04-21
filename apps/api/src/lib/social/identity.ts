const USERNAME_PATTERN = /^(?!.*[._]{2})[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "home",
  "notifications",
  "profile",
  "search",
  "settings",
  "social",
  "soonr",
  "support",
  "system",
  "watchlist",
]);

export type UsernameValidationResult =
  | {
      status: "valid";
      normalizedUsername: string;
    }
  | {
      status: "invalid" | "reserved";
    };

export function validateUsername(username: string): UsernameValidationResult {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !USERNAME_PATTERN.test(normalizedUsername)) {
    return { status: "invalid" };
  }

  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    return { status: "reserved" };
  }

  return {
    status: "valid",
    normalizedUsername,
  };
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
