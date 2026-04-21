import { validateUsername } from "./identity";
import { canViewWatchlist, type WatchlistVisibility } from "./visibility";
import type { WatchlistListResult } from "../contracts";

export interface SocialServiceDependencies {
  isUsernameTaken: (normalizedUsername: string) => Promise<boolean>;
  userExists: (userId: string) => Promise<boolean>;
  createFollow: (params: {
    followerUserId: string;
    followedUserId: string;
  }) => Promise<void>;
  deleteFollow: (params: {
    followerUserId: string;
    followedUserId: string;
  }) => Promise<void>;
  isFollowing: (params: {
    followerUserId: string;
    followedUserId: string;
  }) => Promise<boolean>;
}

export interface ProfileRecord {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  watchlistVisibility: WatchlistVisibility;
}

export interface ProfilePreviewItem {
  id: string;
  titleId: string;
  name: string;
  addedAt: string;
}

export interface SocialConnectionListItem {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  relationship: {
    following: boolean;
    followedByViewer: boolean;
    isFriend: boolean;
  };
}

export async function checkUsernameAvailability(
  params: {
    username: string;
  },
  deps: Pick<SocialServiceDependencies, "isUsernameTaken">,
) {
  const usernameResult = validateUsername(params.username);
  switch (usernameResult.status) {
    case "invalid":
      return {
        available: false,
        reason: "invalid" as const,
      };
    case "reserved":
      return {
        available: false,
        reason: "reserved" as const,
      };
    case "valid": {
      const taken = await deps.isUsernameTaken(
        usernameResult.normalizedUsername,
      );
      if (taken) {
        return {
          available: false,
          reason: "taken" as const,
        };
      }

      return {
        available: true as const,
      };
    }
  }
}

export async function followUser(
  params: {
    actorUserId: string;
    targetUserId: string;
  },
  deps: Pick<
    SocialServiceDependencies,
    "userExists" | "createFollow" | "isFollowing"
  >,
) {
  if (params.actorUserId === params.targetUserId) {
    throw new Error("You cannot follow yourself.");
  }

  const exists = await deps.userExists(params.targetUserId);
  if (!exists) {
    throw new Error("Target user not found.");
  }

  await deps.createFollow({
    followerUserId: params.actorUserId,
    followedUserId: params.targetUserId,
  });

  const targetFollowsActor = await deps.isFollowing({
    followerUserId: params.targetUserId,
    followedUserId: params.actorUserId,
  });

  return {
    following: true as const,
    isFriend: targetFollowsActor,
  };
}

export async function unfollowUser(
  params: {
    actorUserId: string;
    targetUserId: string;
  },
  deps: Pick<SocialServiceDependencies, "deleteFollow">,
) {
  await deps.deleteFollow({
    followerUserId: params.actorUserId,
    followedUserId: params.targetUserId,
  });

  return {
    following: false as const,
    isFriend: false as const,
  };
}

export async function getProfileOverview(
  params: {
    viewerUserId: string;
    targetUserId: string;
  },
  deps: {
    getProfileByUserId: (userId: string) => Promise<ProfileRecord | null>;
    getFollowCounts: (userId: string) => Promise<{
      followers: number;
      following: number;
      friends: number;
    }>;
    isFollowing: (params: {
      followerUserId: string;
      followedUserId: string;
    }) => Promise<boolean>;
    listProfileWatchlistPreview: (
      userId: string,
    ) => Promise<ProfilePreviewItem[]>;
    listProfileRecentAdditionsPreview: (
      userId: string,
    ) => Promise<ProfilePreviewItem[]>;
  },
) {
  const profile = await deps.getProfileByUserId(params.targetUserId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const [viewerFollowsTarget, targetFollowsViewer, counts] = await Promise.all([
    params.viewerUserId === params.targetUserId
      ? Promise.resolve(false)
      : deps.isFollowing({
          followerUserId: params.viewerUserId,
          followedUserId: params.targetUserId,
        }),
    params.viewerUserId === params.targetUserId
      ? Promise.resolve(false)
      : deps.isFollowing({
          followerUserId: params.targetUserId,
          followedUserId: params.viewerUserId,
        }),
    deps.getFollowCounts(params.targetUserId),
  ]);

  const isFriend = viewerFollowsTarget && targetFollowsViewer;
  const watchlistVisible = canViewWatchlist({
    viewerUserId: params.viewerUserId,
    ownerUserId: params.targetUserId,
    watchlistVisibility: profile.watchlistVisibility,
    isFriend,
  });

  const [watchlistPreview, recentAdditionsPreview] = watchlistVisible
    ? await Promise.all([
        deps.listProfileWatchlistPreview(params.targetUserId),
        deps.listProfileRecentAdditionsPreview(params.targetUserId),
      ])
    : [[], []];

  return {
    profile,
    relationship: {
      following:
        params.viewerUserId === params.targetUserId
          ? false
          : viewerFollowsTarget,
      followedByViewer:
        params.viewerUserId === params.targetUserId
          ? false
          : targetFollowsViewer,
      isFriend,
    },
    counts,
    canViewWatchlist: watchlistVisible,
    watchlistPreview,
    recentAdditionsPreview,
  };
}

export async function listProfileWatchlist(
  params: {
    viewerUserId: string;
    targetUserId: string;
    limit: number;
    cursor: string | null;
  },
  deps: {
    getProfileByUserId: (userId: string) => Promise<ProfileRecord | null>;
    isFollowing: (params: {
      followerUserId: string;
      followedUserId: string;
    }) => Promise<boolean>;
    listProfileWatchlistPage: (params: {
      userId: string;
      limit: number;
      cursor: string | null;
    }) => Promise<WatchlistListResult>;
  },
) {
  const profile = await deps.getProfileByUserId(params.targetUserId);
  if (!profile) {
    throw new Error("Profile not found.");
  }

  const isFriend =
    params.viewerUserId === params.targetUserId
      ? true
      : (await deps.isFollowing({
          followerUserId: params.viewerUserId,
          followedUserId: params.targetUserId,
        })) &&
        (await deps.isFollowing({
          followerUserId: params.targetUserId,
          followedUserId: params.viewerUserId,
        }));

  if (
    !canViewWatchlist({
      viewerUserId: params.viewerUserId,
      ownerUserId: params.targetUserId,
      watchlistVisibility: profile.watchlistVisibility,
      isFriend,
    })
  ) {
    throw new Error("Watchlist is not visible to this viewer.");
  }

  return deps.listProfileWatchlistPage({
    userId: params.targetUserId,
    limit: params.limit,
    cursor: params.cursor,
  });
}

export async function listProfileConnections(
  params: {
    viewerUserId: string;
    targetUserId: string;
    kind: "followers" | "following" | "friends";
    limit: number;
    cursor: string | null;
  },
  deps: {
    listFollowers: (params: {
      viewerUserId: string;
      targetUserId: string;
      limit: number;
      cursor: string | null;
    }) => Promise<{
      items: SocialConnectionListItem[];
      nextCursor: string | null;
    }>;
    listFollowing: (params: {
      viewerUserId: string;
      targetUserId: string;
      limit: number;
      cursor: string | null;
    }) => Promise<{
      items: SocialConnectionListItem[];
      nextCursor: string | null;
    }>;
    listFriends: (params: {
      viewerUserId: string;
      targetUserId: string;
      limit: number;
      cursor: string | null;
    }) => Promise<{
      items: SocialConnectionListItem[];
      nextCursor: string | null;
    }>;
  },
) {
  switch (params.kind) {
    case "followers":
      return deps.listFollowers(params);
    case "following":
      return deps.listFollowing(params);
    case "friends":
      return deps.listFriends(params);
  }
}
