export type Route =
  | { kind: "home-discovery" }
  | { kind: "search" }
  | { kind: "detail"; id: string }
  | { kind: "notification-preferences" }
  | { kind: "notifications-list" }
  | { kind: "notifications-unread-count" }
  | { kind: "notifications-read"; notificationId: string }
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

  if (resource === "notification-preferences") {
    if (segments.length !== apiIndex + 2) {
      return null;
    }

    return { kind: "notification-preferences" };
  }

  if (resource === "notifications") {
    if (!maybeId) {
      return { kind: "notifications-list" };
    }

    if (maybeId === "unread-count" && segments.length === apiIndex + 3) {
      return { kind: "notifications-unread-count" };
    }

    const action = segments[apiIndex + 3];
    if (action === "read" && segments.length === apiIndex + 4) {
      return {
        kind: "notifications-read",
        notificationId: decodeURIComponent(maybeId),
      };
    }

    return null;
  }

  return null;
}
