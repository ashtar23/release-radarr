import assert from "node:assert/strict";
import test from "node:test";

import {
  SignUpConflictError,
  SignUpValidationError,
  checkEmailAvailability,
  signUpUser,
} from "./auth-service";

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

test("signUpUser rejects when email is already registered", async () => {
  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "taken@example.com",
          password: "password123",
          username: "vlad",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => true,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            throw new Error("should not create auth user");
          },
          persistUserIdentity: async () => {
            throw new Error("should not persist identity");
          },
          deleteAuthUser: async () => {},
        },
      ),
    (error) =>
      error instanceof SignUpConflictError && error.reason === "email_taken",
  );
});

test("signUpUser rejects when username is already taken", async () => {
  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "taken_name",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => true,
          createAuthUser: async () => {
            throw new Error("should not create auth user");
          },
          persistUserIdentity: async () => {
            throw new Error("should not persist identity");
          },
          deleteAuthUser: async () => {},
        },
      ),
    (error) =>
      error instanceof SignUpConflictError && error.reason === "username_taken",
  );
});

test("signUpUser rejects malformed usernames", async () => {
  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "!!",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            throw new Error("should not create auth user");
          },
          persistUserIdentity: async () => {
            throw new Error("should not persist identity");
          },
          deleteAuthUser: async () => {},
        },
      ),
    (error) =>
      error instanceof SignUpValidationError &&
      error.reason === "invalid_username",
  );
});

test("signUpUser rejects reserved usernames", async () => {
  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "soonr",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            throw new Error("should not create auth user");
          },
          persistUserIdentity: async () => {
            throw new Error("should not persist identity");
          },
          deleteAuthUser: async () => {},
        },
      ),
    (error) =>
      error instanceof SignUpValidationError &&
      error.reason === "reserved_username",
  );
});

test("signUpUser creates auth user and persists identity state", async () => {
  const calls: string[] = [];

  const result = await signUpUser(
    {
      email: " Vlad@Example.com ",
      password: "password123",
      username: " Vlad.Dev ",
      displayName: "Vlad",
    },
    {
      isEmailRegistered: async (emailNormalized) => {
        calls.push(`email:${emailNormalized}`);
        return false;
      },
      isUsernameTaken: async (usernameNormalized) => {
        calls.push(`username:${usernameNormalized}`);
        return false;
      },
      createAuthUser: async (params) => {
        calls.push(`create:${params.email}:${params.emailConfirmed}`);
        return {
          userId: "user-1",
          email: params.email,
        };
      },
      persistUserIdentity: async (params) => {
        calls.push(
          `persist:${params.userId}:${params.email}:${params.username}:${params.displayName}`,
        );
      },
      deleteAuthUser: async () => {
        calls.push("delete");
      },
    },
  );

  assert.deepEqual(calls, [
    "email:vlad@example.com",
    "username:vlad.dev",
    "create:vlad@example.com:true",
    "persist:user-1:vlad@example.com:vlad.dev:Vlad",
  ]);
  assert.deepEqual(result, {
    userId: "user-1",
    email: "vlad@example.com",
    username: "vlad.dev",
    displayName: "Vlad",
    nextStep: "sign-in",
  });
});

test("signUpUser maps auth creation email conflicts to a signup conflict", async () => {
  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "vlad",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            throw new Error("User already registered");
          },
          persistUserIdentity: async () => {
            throw new Error("should not persist identity");
          },
          deleteAuthUser: async () => {},
        },
      ),
    (error) =>
      error instanceof SignUpConflictError && error.reason === "email_taken",
  );
});

test("signUpUser deletes auth user when local persistence fails", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "vlad",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            calls.push("create");
            return {
              userId: "user-1",
              email: "free@example.com",
            };
          },
          persistUserIdentity: async () => {
            calls.push("persist");
            throw new Error("db write failed");
          },
          deleteAuthUser: async (userId) => {
            calls.push(`delete:${userId}`);
          },
        },
      ),
    /db write failed/i,
  );

  assert.deepEqual(calls, ["create", "persist", "delete:user-1"]);
});

test("signUpUser maps username uniqueness races to a conflict after cleanup", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "vlad",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            calls.push("create");
            return {
              userId: "user-1",
              email: "free@example.com",
            };
          },
          persistUserIdentity: async () => {
            calls.push("persist");
            const error = new Error(
              "duplicate key value violates unique constraint",
            );
            Object.assign(error, {
              code: "23505",
              constraint: "user_profiles_username_normalized_key",
            });
            throw error;
          },
          deleteAuthUser: async (userId) => {
            calls.push(`delete:${userId}`);
          },
        },
      ),
    (error) =>
      error instanceof SignUpConflictError && error.reason === "username_taken",
  );

  assert.deepEqual(calls, ["create", "persist", "delete:user-1"]);
});

test("signUpUser preserves the original persistence failure when cleanup fails", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      signUpUser(
        {
          email: "free@example.com",
          password: "password123",
          username: "vlad",
          displayName: "Vlad",
        },
        {
          isEmailRegistered: async () => false,
          isUsernameTaken: async () => false,
          createAuthUser: async () => {
            calls.push("create");
            return {
              userId: "user-1",
              email: "free@example.com",
            };
          },
          persistUserIdentity: async () => {
            calls.push("persist");
            throw new Error("db write failed");
          },
          deleteAuthUser: async (userId) => {
            calls.push(`delete:${userId}`);
            throw new Error("delete failed");
          },
        },
      ),
    /db write failed/i,
  );

  assert.deepEqual(calls, ["create", "persist", "delete:user-1"]);
});
