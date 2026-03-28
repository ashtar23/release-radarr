export function toAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      error.message.trim().toLowerCase().includes("invalid login credentials")
    ) {
      return "Wrong email or password.";
    }

    return error.message;
  }

  return "Something went wrong.";
}
