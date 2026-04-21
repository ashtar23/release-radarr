import { validateUsername } from "./social/identity";

export interface AuthServiceDependencies {
  isEmailRegistered: (normalizedEmail: string) => Promise<boolean>;
}

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export class SignUpConflictError extends Error {
  constructor(
    readonly reason: "email_taken" | "username_taken",
    message: string,
  ) {
    super(message);
    this.name = "SignUpConflictError";
  }
}

export class SignUpValidationError extends Error {
  constructor(
    readonly reason: "invalid_username" | "reserved_username",
    message: string,
  ) {
    super(message);
    this.name = "SignUpValidationError";
  }
}

function isUsernameUniqueViolation(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    "constraint" in error &&
    error.code === "23505" &&
    error.constraint === "user_profiles_username_normalized_key"
  );
}

function isEmailAlreadyRegisteredError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.trim().toLowerCase();
  return (
    normalizedMessage.includes("user already registered") ||
    normalizedMessage.includes("already been registered") ||
    normalizedMessage.includes("email address is already registered")
  );
}

export interface SignUpDependencies extends AuthServiceDependencies {
  isUsernameTaken: (normalizedUsername: string) => Promise<boolean>;
  createAuthUser: (params: {
    email: string;
    password: string;
    emailConfirmed: boolean;
  }) => Promise<{
    userId: string;
    email: string;
  }>;
  persistUserIdentity: (params: {
    userId: string;
    email: string;
    username: string;
    displayName: string | null;
  }) => Promise<void>;
  deleteAuthUser: (userId: string) => Promise<void>;
}

export async function checkEmailAvailability(
  params: {
    email: string;
  },
  deps: Pick<AuthServiceDependencies, "isEmailRegistered">,
) {
  const normalizedEmail = normalizeAuthEmail(params.email);
  const taken = await deps.isEmailRegistered(normalizedEmail);

  if (taken) {
    return {
      available: false,
      reason: "taken",
    };
  }

  return {
    available: true,
  };
}

export async function signUpUser(
  params: {
    email: string;
    password: string;
    username: string;
    displayName?: string | null;
  },
  deps: SignUpDependencies,
) {
  const normalizedEmail = normalizeAuthEmail(params.email);
  const usernameResult = validateUsername(params.username);

  switch (usernameResult.status) {
    case "invalid":
      throw new SignUpValidationError(
        "invalid_username",
        "Username is invalid.",
      );
    case "reserved":
      throw new SignUpValidationError(
        "reserved_username",
        "Username is reserved.",
      );
    case "valid":
      break;
  }

  const [emailTaken, usernameTaken] = await Promise.all([
    deps.isEmailRegistered(normalizedEmail),
    deps.isUsernameTaken(usernameResult.normalizedUsername),
  ]);

  if (emailTaken) {
    throw new SignUpConflictError(
      "email_taken",
      "An account with this email already exists.",
    );
  }

  if (usernameTaken) {
    throw new SignUpConflictError(
      "username_taken",
      "This username is already taken.",
    );
  }

  let authUser: Awaited<ReturnType<SignUpDependencies["createAuthUser"]>>;

  try {
    authUser = await deps.createAuthUser({
      email: normalizedEmail,
      password: params.password,
      emailConfirmed: true,
    });
  } catch (error) {
    if (isEmailAlreadyRegisteredError(error)) {
      throw new SignUpConflictError(
        "email_taken",
        "An account with this email already exists.",
      );
    }

    throw error;
  }

  try {
    await deps.persistUserIdentity({
      userId: authUser.userId,
      email: authUser.email,
      username: usernameResult.normalizedUsername,
      displayName: params.displayName?.trim() || null,
    });
  } catch (error) {
    try {
      await deps.deleteAuthUser(authUser.userId);
    } catch {
      // Preserve the primary persistence failure if cleanup also fails.
    }

    if (isUsernameUniqueViolation(error)) {
      throw new SignUpConflictError(
        "username_taken",
        "This username is already taken.",
      );
    }

    throw error;
  }

  return {
    userId: authUser.userId,
    email: authUser.email,
    username: usernameResult.normalizedUsername,
    displayName: params.displayName?.trim() || null,
    nextStep: "sign-in" as const,
  };
}
