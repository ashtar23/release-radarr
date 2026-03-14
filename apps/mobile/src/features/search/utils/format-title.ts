import type { TitleSummary } from "@repo/types";

export function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function formatPlatforms(result: TitleSummary) {
  if (!result.platforms.length) return "Unknown";
  return result.platforms.map((platform) => platform.name).join(", ");
}
