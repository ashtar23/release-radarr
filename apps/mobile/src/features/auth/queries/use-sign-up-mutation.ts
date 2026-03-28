import type { AuthCredentialsInput } from "@repo/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import { useAuthMutation } from "./use-auth-mutation";

export function useSignUpMutation(
  options?: Omit<
    UseMutationOptions<void, unknown, AuthCredentialsInput>,
    "mutationFn"
  >,
) {
  const { signUpWithPassword } = useAuth();

  return useAuthMutation<AuthCredentialsInput>({
    ...options,
    mutationFn: async (values) => {
      await signUpWithPassword(values.email, values.password);
    },
  });
}
