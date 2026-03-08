import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeSupabaseClient } from "@repo/api-client";
import { SUPABASE_MOBILE_ENV } from "@repo/config";

const initializedClient = initializeSupabaseClient({
  // Expo requires static EXPO_PUBLIC_* reads so values can be inlined at bundle time.
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  missingConfigMessage: `Missing ${SUPABASE_MOBILE_ENV.url} or ${SUPABASE_MOBILE_ENV.publishableKey}.`,
  clientOptions: {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
});

export const isSupabaseConfigured = initializedClient.isConfigured;

export const supabaseConfigError = initializedClient.configError;

export const supabase = initializedClient.client;
