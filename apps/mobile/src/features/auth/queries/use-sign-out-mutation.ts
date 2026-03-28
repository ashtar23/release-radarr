import type { UseMutationOptions } from "@tanstack/react-query";

import { useAuth } from "@/auth/auth-provider";

import { useAuthMutation } from "./use-auth-mutation";

export function useSignOutMutation(
  options?: Omit<UseMutationOptions<void, unknown, void>, "mutationFn">,
) {
  const { signOut } = useAuth();

  return useAuthMutation<void>({
    ...options,
    mutationFn: async () => {
      await signOut();
    },
  });
}
