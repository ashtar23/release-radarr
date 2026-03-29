import type { SignUpCredentialsInput } from "@repo/types/auth";
import type { UseMutationOptions } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import { useAuthMutation } from "./use-auth-mutation";

export function useSignUpMutation(
  options?: Omit<
    UseMutationOptions<void, unknown, SignUpCredentialsInput>,
    "mutationFn"
  >,
) {
  const { signUpWithPassword } = useAuth();

  return useAuthMutation<SignUpCredentialsInput>({
    ...options,
    mutationFn: async (values) => {
      await signUpWithPassword(values.email, values.password);
    },
  });
}
