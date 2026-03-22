export function formatReleaseDate(value: string | null) {
  if (!value) return "Release date unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}

export function formatList(values: string[]) {
  if (!values.length) return "Unknown";
  return values.join(", ");
}

export function toDetailErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("(404)")) {
      return "Title not found.";
    }

    return error.message;
  }

  return "Unable to load title details.";
}

type ReleaseMetaParams = {
  releaseDate: string | null;
  platformCount: number;
};

export function toReleaseMetaLine({
  releaseDate,
  platformCount,
}: ReleaseMetaParams) {
  const date = releaseDate ? new Date(releaseDate) : null;
  const releaseYear =
    date && !Number.isNaN(date.getTime()) ? String(date.getFullYear()) : null;
  const platformLabel =
    platformCount <= 0
      ? "Platform availability unknown"
      : platformCount === 1
        ? "1 platform"
        : `${platformCount} platforms`;

  return releaseYear ? `${releaseYear} • ${platformLabel}` : platformLabel;
}
