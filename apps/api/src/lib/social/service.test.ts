import assert from "node:assert/strict";
import test from "node:test";

import {
  checkUsernameAvailability,
  followUser,
  getProfileOverview,
  listProfileConnections,
  listProfileWatchlist,
  unfollowUser,
} from "./service";

test("checkUsernameAvailability returns invalid for malformed usernames", async () => {
  const result = await checkUsernameAvailability(
    { username: "!!" },
    {
      isUsernameTaken: async () => false,
    },
  );

  assert.deepEqual(result, {
    available: false,
    reason: "invalid",
  });
});

test("checkUsernameAvailability returns reserved for protected usernames", async () => {
  const result = await checkUsernameAvailability(
    { username: "Soonr" },
    {
      isUsernameTaken: async () => false,
    },
  );

  assert.deepEqual(result, {
    available: false,
    reason: "reserved",
  });
});

test("checkUsernameAvailability normalizes usernames before checking availability", async () => {
  const checked: string[] = [];

  const result = await checkUsernameAvailability(
    { username: " Vlad_Dev " },
    {
      isUsernameTaken: async (usernameNormalized) => {
        checked.push(usernameNormalized);
        return true;
      },
    },
  );

  assert.deepEqual(checked, ["vlad_dev"]);
  assert.deepEqual(result, {
    available: false,
    reason: "taken",
  });
});

test("checkUsernameAvailability returns available for a valid untaken username", async () => {
  const result = await checkUsernameAvailability(
    { username: "vlad.dev" },
    {
      isUsernameTaken: async () => false,
    },
  );

  assert.deepEqual(result, {
    available: true,
  });
});

test("followUser rejects following yourself", async () => {
  await assert.rejects(
    () =>
      followUser(
        { actorUserId: "user-1", targetUserId: "user-1" },
        {
          userExists: async () => true,
          createFollow: async () => {},
          isFollowing: async () => false,
        },
      ),
    /cannot follow yourself/i,
  );
});

test("followUser rejects unknown targets", async () => {
  await assert.rejects(
    () =>
      followUser(
        { actorUserId: "user-1", targetUserId: "user-2" },
        {
          userExists: async () => false,
          createFollow: async () => {},
          isFollowing: async () => false,
        },
      ),
    /target user not found/i,
  );
});

test("followUser returns friend state when the target already follows the actor", async () => {
  const created: Array<{ followerUserId: string; followedUserId: string }> = [];

  const result = await followUser(
    { actorUserId: "user-1", targetUserId: "user-2" },
    {
      userExists: async () => true,
      createFollow: async (params) => {
        created.push(params);
      },
      isFollowing: async () => true,
    },
  );

  assert.deepEqual(created, [
    { followerUserId: "user-1", followedUserId: "user-2" },
  ]);
  assert.deepEqual(result, {
    following: true,
    isFriend: true,
  });
});

test("unfollowUser is idempotent and returns non-friend state", async () => {
  const deleted: Array<{ followerUserId: string; followedUserId: string }> = [];

  const result = await unfollowUser(
    { actorUserId: "user-1", targetUserId: "user-2" },
    {
      deleteFollow: async (params) => {
        deleted.push(params);
      },
    },
  );

  assert.deepEqual(deleted, [
    { followerUserId: "user-1", followedUserId: "user-2" },
  ]);
  assert.deepEqual(result, {
    following: false,
    isFriend: false,
  });
});

test("getProfileOverview hides watchlist preview when viewer lacks access", async () => {
  const result = await getProfileOverview(
    { viewerUserId: "viewer-1", targetUserId: "owner-1" },
    {
      getProfileByUserId: async () => ({
        userId: "owner-1",
        username: "owner",
        displayName: "Owner",
        avatarUrl: null,
        bio: null,
        watchlistVisibility: "private",
      }),
      getFollowCounts: async () => ({
        followers: 3,
        following: 4,
        friends: 1,
      }),
      isFollowing: async () => false,
      listProfileWatchlistPreview: async () => {
        throw new Error("should not query watchlist preview");
      },
      listProfileRecentAdditionsPreview: async () => {
        throw new Error("should not query recent additions preview");
      },
    },
  );

  assert.equal(result.canViewWatchlist, false);
  assert.deepEqual(result.watchlistPreview, []);
  assert.deepEqual(result.recentAdditionsPreview, []);
});

test("getProfileOverview shows watchlist preview for friends-visible profiles when mutual follow exists", async () => {
  const watchlistPreview = [
    {
      id: "item-1",
      titleId: "rawg:1",
      name: "Alpha",
      addedAt: "2026-04-21T10:00:00.000Z",
    },
  ];

  const result = await getProfileOverview(
    { viewerUserId: "viewer-1", targetUserId: "owner-1" },
    {
      getProfileByUserId: async () => ({
        userId: "owner-1",
        username: "owner",
        displayName: "Owner",
        avatarUrl: null,
        bio: null,
        watchlistVisibility: "friends",
      }),
      getFollowCounts: async () => ({
        followers: 3,
        following: 4,
        friends: 1,
      }),
      isFollowing: async () => true,
      listProfileWatchlistPreview: async () => watchlistPreview,
      listProfileRecentAdditionsPreview: async () => watchlistPreview,
    },
  );

  assert.equal(result.relationship.isFriend, true);
  assert.equal(result.canViewWatchlist, true);
  assert.deepEqual(result.watchlistPreview, watchlistPreview);
  assert.deepEqual(result.recentAdditionsPreview, watchlistPreview);
});

test("listProfileWatchlist rejects access when viewer cannot see the watchlist", async () => {
  await assert.rejects(
    () =>
      listProfileWatchlist(
        {
          viewerUserId: "viewer-1",
          targetUserId: "owner-1",
          limit: 20,
          cursor: null,
        },
        {
          getProfileByUserId: async () => ({
            userId: "owner-1",
            username: "owner",
            displayName: "Owner",
            avatarUrl: null,
            bio: null,
            watchlistVisibility: "private",
          }),
          isFollowing: async () => false,
          listProfileWatchlistPage: async () => ({
            items: [],
            nextCursor: null,
          }),
        },
      ),
    /watchlist is not visible/i,
  );
});

test("listProfileConnections routes followers requests to the followers query", async () => {
  let called: string | null = null;

  const result = await listProfileConnections(
    {
      viewerUserId: "viewer-1",
      targetUserId: "owner-1",
      kind: "followers",
      limit: 20,
      cursor: null,
    },
    {
      listFollowers: async () => {
        called = "followers";
        return {
          items: [
            {
              userId: "user-2",
              username: "user2",
              displayName: "User Two",
              avatarUrl: null,
              relationship: {
                following: false,
                followedByViewer: false,
                isFriend: false,
              },
            },
          ],
          nextCursor: null,
        };
      },
      listFollowing: async () => {
        throw new Error("unexpected following call");
      },
      listFriends: async () => {
        throw new Error("unexpected friends call");
      },
    },
  );

  assert.equal(called, "followers");
  assert.equal(result.items.length, 1);
});
