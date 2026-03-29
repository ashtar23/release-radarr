export function toAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const normalizedMessage = error.message.trim().toLowerCase();

    if (normalizedMessage.includes("invalid login credentials")) {
      return "Wrong email or password.";
    }

    if (
      normalizedMessage.includes("user already registered") ||
      normalizedMessage.includes("already been registered") ||
      normalizedMessage.includes("email address is already registered")
    ) {
      return "An account with this email already exists.";
    }

    return error.message;
  }

  return "Something went wrong.";
}
