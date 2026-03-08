import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";

export interface InitializeSupabaseClientOptions {
  readonly url: string | undefined;
  readonly publishableKey: string | undefined;
  readonly missingConfigMessage: string;
  readonly clientOptions?: SupabaseClientOptions<"public">;
}

export interface InitializedSupabaseClient {
  readonly client: SupabaseClient | null;
  readonly isConfigured: boolean;
  readonly configError: string | null;
}

export function initializeSupabaseClient({
  url,
  publishableKey,
  missingConfigMessage,
  clientOptions,
}: InitializeSupabaseClientOptions): InitializedSupabaseClient {
  if (!url || !publishableKey) {
    return {
      client: null,
      isConfigured: false,
      configError: missingConfigMessage,
    };
  }

  return {
    client: createClient(url, publishableKey, clientOptions),
    isConfigured: true,
    configError: null,
  };
}
