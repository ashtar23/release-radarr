import type { TitleSummary } from "@repo/types";

export function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function formatReleaseDateCompact(value: string | null) {
  if (!value) return "Date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatPlatforms(result: TitleSummary) {
  if (!result.platforms.length) return "Unknown";
  return result.platforms.map((platform) => platform.name).join(", ");
}

export function formatSearchMetaLine(result: TitleSummary) {
  const releaseText = formatReleaseDateCompact(result.earliestReleaseDate);
  if (!result.platforms.length) return releaseText;

  const names = result.platforms.map((platform) => platform.name).filter(Boolean);
  const previewLimit = 2;
  const preview = names.slice(0, previewLimit).join(", ");
  const remainder = names.length - previewLimit;
  const platformText = remainder > 0 ? `${preview} +${remainder}` : preview;

  return `${releaseText} - ${platformText}`;
}
