import type { AuthCredentialsInput } from "@repo/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import { useAuthMutation } from "./use-auth-mutation";

export function useSignInMutation(
  options?: Omit<
    UseMutationOptions<void, unknown, AuthCredentialsInput>,
    "mutationFn"
  >,
) {
  const { signInWithPassword } = useAuth();

  return useAuthMutation<AuthCredentialsInput>({
    ...options,
    mutationFn: async (values) => {
      await signInWithPassword(values.email, values.password);
    },
  });
}
