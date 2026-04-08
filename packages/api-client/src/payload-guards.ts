import type { HealthStatus } from "@repo/types";

export function isHealthStatus(value: unknown): value is HealthStatus {
  return (
    isRecord(value) &&
    value.status === "ok" &&
    typeof value.appEnv === "string" &&
    (value.dataSource === "postgres" || value.dataSource === "supabase")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
