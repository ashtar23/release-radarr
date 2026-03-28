export type Route =
  | { kind: "home-discovery" }
  | { kind: "search" }
  | { kind: "detail"; id: string }
  | { kind: "watchlist-list" }
  | { kind: "watchlist-item"; titleId: string };

export function resolveRoute(pathname: string): Route | null {
  const segments = pathname.split("/").filter(Boolean);
  const apiIndex = segments.lastIndexOf("api");
  if (apiIndex === -1) {
    return null;
  }

  const resource = segments[apiIndex + 1];
  if (!resource) {
    return null;
  }

  const maybeId = segments[apiIndex + 2];

  if (resource === "home") {
    if (maybeId === "discovery" && segments.length === apiIndex + 3) {
      return { kind: "home-discovery" };
    }

    return null;
  }

  if (resource === "titles") {
    if (!maybeId) {
      return { kind: "search" };
    }

    if (segments.length !== apiIndex + 3) {
      return null;
    }

    return { kind: "detail", id: decodeURIComponent(maybeId) };
  }

  if (resource === "watchlist") {
    if (!maybeId) {
      return { kind: "watchlist-list" };
    }

    if (segments.length !== apiIndex + 3) {
      return null;
    }

    return { kind: "watchlist-item", titleId: decodeURIComponent(maybeId) };
  }

  return null;
}
