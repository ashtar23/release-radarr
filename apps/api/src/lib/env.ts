function getOptionalIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

const APP_ENVS = ["development", "staging", "production", "test"];

export type AppEnv = (typeof APP_ENVS)[number];
export type DataSource = "postgres" | "supabase";

function getAppEnv(): AppEnv {
  const rawValue = process.env.APP_ENV?.trim();
  if (!rawValue) {
    return "development";
  }

  if (APP_ENVS.includes(rawValue as AppEnv)) {
    return rawValue as AppEnv;
  }

  throw new Error(
    `Invalid APP_ENV "${rawValue}". Expected one of: ${APP_ENVS.join(", ")}.`,
  );
}

function getSupabaseConfig() {
  const supabaseUrl = getOptionalEnv("SUPABASE_URL");
  const supabaseSecretKey = getOptionalEnv("SUPABASE_SECRET_KEY");

  if (supabaseUrl && supabaseSecretKey) {
    return {
      supabaseUrl,
      supabaseSecretKey,
    };
  }

  if (!supabaseUrl && !supabaseSecretKey) {
    return {
      supabaseUrl: null,
      supabaseSecretKey: null,
    };
  }

  throw new Error(
    "SUPABASE_URL and SUPABASE_SECRET_KEY must be provided together.",
  );
}

const databaseUrl = getOptionalEnv("DATABASE_URL");
const supabaseConfig = getSupabaseConfig();
const appEnv = getAppEnv();
const dataSource: DataSource = databaseUrl ? "postgres" : "supabase";

if (!databaseUrl && !supabaseConfig.supabaseUrl) {
  throw new Error(
    "Provide DATABASE_URL for direct Postgres access or SUPABASE_URL and SUPABASE_SECRET_KEY for Supabase access.",
  );
}

export const env = {
  appEnv,
  dataSource,
  databaseUrl,
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: getOptionalIntegerEnv("PORT", 3001),
  rawgApiKey: process.env.RAWG_API_KEY?.trim() || null,
  supabaseSecretKey: supabaseConfig.supabaseSecretKey,
  supabaseUrl: supabaseConfig.supabaseUrl,
};
