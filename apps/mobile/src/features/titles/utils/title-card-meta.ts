import type { TitleSummary } from "@repo/types";

function formatReleaseDateCompact(value: string | null) {
  if (!value) return "Date unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTitleCardMetaLine(result: TitleSummary) {
  const releaseText = formatReleaseDateCompact(result.earliestReleaseDate);
  if (!result.platforms.length) return releaseText;

  const names = result.platforms
    .map((platform) => platform.name)
    .filter(Boolean);
  const previewLimit = 2;
  const preview = names.slice(0, previewLimit).join(", ");
  const remainder = names.length - previewLimit;
  const platformText = remainder > 0 ? `${preview} +${remainder}` : preview;

  return `${releaseText} - ${platformText}`;
}
