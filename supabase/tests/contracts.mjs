import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnvFiles();

const supabaseUrl =
  process.env.SUPABASE_LOCAL_URL ??
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "http://127.0.0.1:54321";
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceSecretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!publishableKey) {
  throw new Error("SUPABASE_PUBLISHABLE_KEY is required.");
}
if (!serviceSecretKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required.",
  );
}

function loadEnvFiles() {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const candidates = [
    path.join(repoRoot, ".env"),
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, "supabase/.env"),
    path.join(repoRoot, "apps/web/.env"),
    path.join(repoRoot, "apps/mobile/.env"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    applyEnvContent(content);
  }
}

function applyEnvContent(content) {
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || key in process.env) continue;

    const rawValue = line.slice(separatorIndex + 1).trim();
    process.env[key] = stripWrappingQuotes(rawValue);
  }
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

const seedId = "rawg:contract-test";
const seedExternalId = "contract-test";
const seedName = "Contract Test Title";
const now = new Date().toISOString();

async function run() {
  await upsertSeedRow();

  try {
    await assertSearchContract();
    await assertDetailContract();
    await assertNotificationsContract();
    console.log("Backend contract tests passed.");
  } finally {
    await cleanupSeedRow();
  }
}

async function upsertSeedRow() {
  const response = await fetch(`${supabaseUrl}/rest/v1/titles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
      apikey: serviceSecretKey,
      Authorization: `Bearer ${serviceSecretKey}`,
    },
    body: JSON.stringify([
      {
        id: seedId,
        kind: "game",
        source: "rawg",
        external_id: seedExternalId,
        slug: "contract-test-title",
        name: seedName,
        cover_image_url: null,
        earliest_release_date: "2026-01-01",
        description: "Contract seed row",
        genres: ["RPG"],
        developers: ["Studio One"],
        publishers: ["Publisher One"],
        website_url: "https://example.com",
        rawg_rating: 4.4,
        rawg_ratings_count: 1200,
        rawg_metacritic: 88,
        rawg_added: 9000,
        rawg_reviews_count: 430,
        rawg_suggestions_count: 97,
        rawg_rating_top: 5,
        platforms: [{ id: "rawg-platform:1", name: "PC" }],
        releases: [
          {
            platformId: "rawg-platform:1",
            platformName: "PC",
            releaseDate: "2026-01-01",
            releaseDatePrecision: "day",
          },
        ],
        search_updated_at: now,
        detail_updated_at: now,
        updated_at: now,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(
      `Seed upsert failed: ${response.status} ${await response.text()}`,
    );
  }
}

async function cleanupSeedRow() {
  await fetch(
    `${supabaseUrl}/rest/v1/titles?id=eq.${encodeURIComponent(seedId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceSecretKey,
        Authorization: `Bearer ${serviceSecretKey}`,
      },
    },
  );
}

async function assertSearchContract() {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/api/titles?query=${encodeURIComponent("contract test")}`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Search request failed: ${response.status} ${await response.text()}`,
    );
  }

  const payload = await response.json();
  assert.equal(typeof payload.query, "string");
  assert.equal(Array.isArray(payload.results), true);
  assert.equal(typeof payload.totalCount, "number");
  assert.equal(typeof payload.page, "number");
  assert.equal(typeof payload.limit, "number");
  assert.equal(typeof payload.hasMore, "boolean");
  assert.equal(
    payload.servedBy === "local-cache" || payload.servedBy === "rawg-refresh",
    true,
  );
  assert.equal(
    payload.decisionReason === undefined ||
      payload.decisionReason === "local_sufficient" ||
      payload.decisionReason === "sparse_broad_local" ||
      payload.decisionReason === "forced_refresh" ||
      payload.decisionReason === "provider_missing_key" ||
      payload.decisionReason === "provider_fetch_failed" ||
      payload.decisionReason === "provider_used",
    true,
  );

  const first = payload.results.find((item) => item.id === seedId);
  assert.ok(first, "Expected seeded title in search results.");
  assert.equal(typeof first.name, "string");
  assert.equal(Array.isArray(first.platforms), true);
  assertNullableFiniteNumber(first.rawgRating);
  assertNullableFiniteNumber(first.rawgRatingsCount);
  assertNullableFiniteNumber(first.rawgMetacritic);
  assertNullableFiniteNumber(first.rawgAdded);
  assertNullableFiniteNumber(first.rawgReviewsCount);
  assertNullableFiniteNumber(first.rawgSuggestionsCount);
  assertNullableFiniteNumber(first.rawgRatingTop);
}

async function assertDetailContract() {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/api/titles/${encodeURIComponent(seedId)}`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Detail request failed: ${response.status} ${await response.text()}`,
    );
  }

  const payload = await response.json();
  assert.equal(payload.id, seedId);
  assert.equal(typeof payload.name, "string");
  assert.equal(Array.isArray(payload.platforms), true);
  assert.equal(Array.isArray(payload.releases), true);
  assert.equal(Array.isArray(payload.genres), true);
  assert.equal(Array.isArray(payload.developers), true);
  assert.equal(Array.isArray(payload.publishers), true);
  assertNullableFiniteNumber(payload.rawgRating);
  assertNullableFiniteNumber(payload.rawgRatingsCount);
  assertNullableFiniteNumber(payload.rawgMetacritic);
  assertNullableFiniteNumber(payload.rawgAdded);
  assertNullableFiniteNumber(payload.rawgReviewsCount);
  assertNullableFiniteNumber(payload.rawgSuggestionsCount);
  assertNullableFiniteNumber(payload.rawgRatingTop);
}

async function assertNotificationsContract() {
  const adminHeaders = {
    apikey: serviceSecretKey,
    Authorization: `Bearer ${serviceSecretKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  };
  const notificationId = "notification-record-contract-test";
  const eventId = "notification-event-contract-test";
  const { userId, accessToken } = await createContractUser();

  try {
    const preferencesResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notification-preferences`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
      },
    );
    assert.equal(preferencesResponse.status, 401);

    const unreadResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications/unread-count`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
      },
    );
    assert.equal(unreadResponse.status, 401);

    const listResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
      },
    );
    assert.equal(listResponse.status, 401);

    const seedEventResponse = await fetch(
      `${supabaseUrl}/rest/v1/notification_events`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify([
          {
            id: eventId,
            title_id: seedId,
            event_type: "release_date_changed",
            event_version: 1,
            event_key: "contract-test:key",
            occurred_at: now,
            payload: {
              previousReleaseDate: "2025-12-01",
              nextReleaseDate: "2026-01-01",
            },
            created_at: now,
          },
        ]),
      },
    );

    if (!seedEventResponse.ok) {
      throw new Error(
        `Notification event seed failed: ${seedEventResponse.status} ${await seedEventResponse.text()}`,
      );
    }

    const seedRecordResponse = await fetch(
      `${supabaseUrl}/rest/v1/notification_records`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify([
          {
            id: notificationId,
            user_id: userId,
            event_id: eventId,
            title_id: seedId,
            event_type: "release_date_changed",
            destination_kind: "title",
            destination_title_id: seedId,
            title_name: seedName,
            title_artwork_url: null,
            message: "Contract notification",
            subtitle: "Release date changed",
            payload: {
              previousReleaseDate: "2025-12-01",
              nextReleaseDate: "2026-01-01",
            },
            created_at: now,
            read_at: null,
          },
        ]),
      },
    );

    if (!seedRecordResponse.ok) {
      throw new Error(
        `Notification record seed failed: ${seedRecordResponse.status} ${await seedRecordResponse.text()}`,
      );
    }

    const readPreferencesResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notification-preferences`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!readPreferencesResponse.ok) {
      throw new Error(
        `Notification preferences request failed: ${readPreferencesResponse.status} ${await readPreferencesResponse.text()}`,
      );
    }

    const preferencesPayload = await readPreferencesResponse.json();
    assert.equal(preferencesPayload.preferences.channels.inApp, true);
    assert.equal(preferencesPayload.preferences.channels.push, false);
    assert.equal(
      Array.isArray(preferencesPayload.preferences.timingPresets),
      true,
    );

    const updatePreferencesResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notification-preferences`,
      {
        method: "PUT",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channels: {
            inApp: true,
            push: false,
          },
          events: {
            releaseDateChanged: false,
            releaseApproaching: true,
          },
          timingPresets: ["days_7_before", "on_day"],
        }),
      },
    );
    if (!updatePreferencesResponse.ok) {
      throw new Error(
        `Notification preferences update failed: ${updatePreferencesResponse.status} ${await updatePreferencesResponse.text()}`,
      );
    }

    const updatePreferencesPayload = await updatePreferencesResponse.json();
    assert.equal(
      updatePreferencesPayload.preferences.events.releaseDateChanged,
      false,
    );
    assert.deepEqual(updatePreferencesPayload.preferences.timingPresets, [
      "days_7_before",
      "on_day",
    ]);

    const listAuthenticatedResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications?limit=10`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!listAuthenticatedResponse.ok) {
      throw new Error(
        `Notifications list request failed: ${listAuthenticatedResponse.status} ${await listAuthenticatedResponse.text()}`,
      );
    }

    const listPayload = await listAuthenticatedResponse.json();
    assert.equal(Array.isArray(listPayload.items), true);
    assert.equal(
      listPayload.nextCursor === null ||
        typeof listPayload.nextCursor === "string",
      true,
    );
    const notification = listPayload.items.find(
      (item) => item.id === notificationId,
    );
    assert.ok(notification, "Expected seeded notification in list response.");
    assert.equal(notification.titleId, seedId);
    assert.equal(notification.destinationKind, "title");
    assert.equal(notification.destinationTitleId, seedId);
    assert.equal(notification.titleName, seedName);
    assert.equal(notification.readAt, null);
    assert.equal(notification.payload.previousReleaseDate, "2025-12-01");
    assert.equal(notification.payload.nextReleaseDate, "2026-01-01");

    const unreadAuthenticatedResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications/unread-count`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!unreadAuthenticatedResponse.ok) {
      throw new Error(
        `Notification unread count request failed: ${unreadAuthenticatedResponse.status} ${await unreadAuthenticatedResponse.text()}`,
      );
    }
    const unreadPayload = await unreadAuthenticatedResponse.json();
    assert.equal(typeof unreadPayload.unreadCount, "number");
    assert.equal(unreadPayload.unreadCount >= 1, true);

    const markReadResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications/read`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      },
    );
    if (!markReadResponse.ok) {
      throw new Error(
        `Mark notification read failed: ${markReadResponse.status} ${await markReadResponse.text()}`,
      );
    }
    const markReadPayload = await markReadResponse.json();
    assert.equal(markReadPayload.notification.id, notificationId);
    assert.equal(typeof markReadPayload.notification.readAt, "string");

    const rereadResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications/read`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      },
    );
    assert.equal(rereadResponse.ok, true);

    const unreadAfterReadResponse = await fetch(
      `${supabaseUrl}/functions/v1/api/notifications/unread-count`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const unreadAfterReadPayload = await unreadAfterReadResponse.json();
    assert.equal(unreadAfterReadPayload.unreadCount, 0);
  } finally {
    await fetch(
      `${supabaseUrl}/rest/v1/notification_records?id=eq.${encodeURIComponent(notificationId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceSecretKey,
          Authorization: `Bearer ${serviceSecretKey}`,
        },
      },
    );
    await deleteContractUser(userId);
    await fetch(
      `${supabaseUrl}/rest/v1/notification_events?id=eq.${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceSecretKey,
          Authorization: `Bearer ${serviceSecretKey}`,
        },
      },
    );
  }
}

async function createContractUser() {
  const email = `notifications-contract-${Date.now()}@example.com`;
  const password = "ContractTest123!";

  const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceSecretKey,
      Authorization: `Bearer ${serviceSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  if (!createResponse.ok) {
    throw new Error(
      `Contract user create failed: ${createResponse.status} ${await createResponse.text()}`,
    );
  }

  const createdUser = await createResponse.json();
  const tokenResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error(
      `Contract user token failed: ${tokenResponse.status} ${await tokenResponse.text()}`,
    );
  }

  const tokenPayload = await tokenResponse.json();
  return {
    userId: createdUser.id,
    accessToken: tokenPayload.access_token,
  };
}

async function deleteContractUser(userId) {
  await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceSecretKey,
        Authorization: `Bearer ${serviceSecretKey}`,
      },
    },
  );
}

function assertNullableFiniteNumber(value) {
  assert.equal(
    value === null || (typeof value === "number" && Number.isFinite(value)),
    true,
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
