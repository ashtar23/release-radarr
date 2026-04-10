export type HomeDiscoverySectionKey = "upcoming" | "latest" | "popular";

export const HOME_DISCOVERY_SECTION_META: Record<
  HomeDiscoverySectionKey,
  {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
  }
> = {
  upcoming: {
    title: "Releasing Soon",
    emptyTitle: "No upcoming titles",
    emptyDescription: "There are no upcoming discovery titles to show right now.",
  },
  latest: {
    title: "Recently Released",
    emptyTitle: "No recent releases",
    emptyDescription: "There are no recent discovery titles to show right now.",
  },
  popular: {
    title: "Worth Watching",
    emptyTitle: "No titles to watch",
    emptyDescription: "There are no worth-watching discovery titles to show right now.",
  },
};

export function isHomeDiscoverySectionKey(
  value: string | string[] | undefined,
): value is HomeDiscoverySectionKey {
  return value === "upcoming" || value === "latest" || value === "popular";
}
