import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../context/auth-context";

interface MutationLifecycleOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function useSignOutMutation(options: MutationLifecycleOptions = {}) {
  const { signOut } = useAuth();

  return useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
