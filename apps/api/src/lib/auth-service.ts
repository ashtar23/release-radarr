export interface AuthServiceDependencies {
  isEmailRegistered: (normalizedEmail: string) => Promise<boolean>;
}

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
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
