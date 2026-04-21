import assert from "node:assert/strict";
import test from "node:test";

import { checkEmailAvailability } from "./auth-service";

test("checkEmailAvailability normalizes email before checking availability", async () => {
  const checked: string[] = [];

  const result = await checkEmailAvailability(
    { email: " Vlad@Example.COM " },
    {
      isEmailRegistered: async (normalizedEmail) => {
        checked.push(normalizedEmail);
        return true;
      },
    },
  );

  assert.deepEqual(checked, ["vlad@example.com"]);
  assert.deepEqual(result, {
    available: false,
    reason: "taken",
  });
});

test("checkEmailAvailability returns available for an untaken email", async () => {
  const result = await checkEmailAvailability(
    { email: "new@example.com" },
    {
      isEmailRegistered: async () => false,
    },
  );

  assert.deepEqual(result, {
    available: true,
  });
});
