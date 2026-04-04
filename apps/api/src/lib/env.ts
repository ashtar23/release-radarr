function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getOptionalIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

export const env = {
  appEnv: process.env.APP_ENV?.trim() || "development",
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: getOptionalIntegerEnv("PORT", 3001),
  rawgApiKey: process.env.RAWG_API_KEY?.trim() || null,
  supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseUrl: getRequiredEnv("SUPABASE_URL"),
} as const;
