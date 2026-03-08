import assert from "node:assert/strict";

const supabaseUrl = process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321";
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!publishableKey) {
  throw new Error("SUPABASE_PUBLISHABLE_KEY is required.");
}
if (!serviceSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is required.");
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
  await fetch(`${supabaseUrl}/rest/v1/titles?id=eq.${encodeURIComponent(seedId)}`, {
    method: "DELETE",
    headers: {
      apikey: serviceSecretKey,
      Authorization: `Bearer ${serviceSecretKey}`,
    },
  });
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

  const first = payload.results.find((item) => item.id === seedId);
  assert.ok(first, "Expected seeded title in search results.");
  assert.equal(typeof first.name, "string");
  assert.equal(Array.isArray(first.platforms), true);
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
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
