export type Route = { kind: "search" } | { kind: "detail"; id: string };

export function resolveRoute(pathname: string): Route | null {
  const segments = pathname.split("/").filter(Boolean);
  const titlesIndex = segments.lastIndexOf("titles");
  if (titlesIndex === -1) {
    return null;
  }

  const maybeId = segments[titlesIndex + 1];
  if (!maybeId) {
    return { kind: "search" };
  }

  if (segments.length !== titlesIndex + 2) {
    return null;
  }

  return { kind: "detail", id: decodeURIComponent(maybeId) };
}
