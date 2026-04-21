export type WatchlistVisibility = "private" | "friends" | "public";

export function canViewWatchlist(params: {
  viewerUserId: string;
  ownerUserId: string;
  watchlistVisibility: WatchlistVisibility;
  isFriend: boolean;
}) {
  if (params.viewerUserId === params.ownerUserId) {
    return true;
  }

  switch (params.watchlistVisibility) {
    case "public":
      return true;
    case "friends":
      return params.isFriend;
    case "private":
    default:
      return false;
  }
}
