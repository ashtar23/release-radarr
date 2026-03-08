import { useMutation } from "@tanstack/react-query";
import type { AuthCredentialsInput } from "@repo/types/auth";

import { useAuth } from "../context/auth-context";

interface MutationLifecycleOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useSignInMutation(options: MutationLifecycleOptions = {}) {
  const { signInWithPassword } = useAuth();

  return useMutation({
    mutationFn: async (values: AuthCredentialsInput) => {
      await signInWithPassword(values.email, values.password);
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
