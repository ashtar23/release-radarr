import React from "react";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";

import { toAuthErrorMessage } from "./auth-error";

export function useAuthMutation<TVariables>(
  options: Omit<UseMutationOptions<void, unknown, TVariables>, "mutationFn"> & {
    mutationFn: (variables: TVariables) => Promise<void>;
  },
) {
  const lastErrorMessageRef = React.useRef<string | null>(null);

  const mutation = useMutation<void, unknown, TVariables>({
    ...options,
    mutationFn: options.mutationFn,
    onSuccess: async (...args) => {
      lastErrorMessageRef.current = null;
      await options.onSuccess?.(...args);
    },
    onError: async (...args) => {
      lastErrorMessageRef.current = toAuthErrorMessage(args[0]);
      await options.onError?.(...args);
    },
  });

  const resetErrorState = React.useCallback(() => {
    lastErrorMessageRef.current = null;
    mutation.reset();
  }, [mutation]);

  const errorMessage = mutation.isError
    ? toAuthErrorMessage(mutation.error)
    : lastErrorMessageRef.current;

  return {
    ...mutation,
    errorMessage,
    resetErrorState,
  };
}
