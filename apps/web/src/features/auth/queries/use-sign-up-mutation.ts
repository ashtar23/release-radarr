import { useMutation } from "@tanstack/react-query";
import type { AuthCredentialsInput } from "@repo/types/auth";

import { useAuth } from "../context/auth-context";

interface MutationLifecycleOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useSignUpMutation(options: MutationLifecycleOptions = {}) {
  const { signUpWithPassword } = useAuth();

  return useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signUpWithPassword(values.email, values.password);
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
