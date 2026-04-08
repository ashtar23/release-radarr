import { Pool } from "pg";

import type { Database } from "@shared/database-types";
import { env } from "./env";

type CachedTitleRow = Database["public"]["Tables"]["titles"]["Row"];

let pool: Pool | null = null;

export function getPostgresPool() {
  if (pool) {
    return pool;
  }

  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required for direct Postgres access.");
  }

  pool = new Pool({
    connectionString: env.databaseUrl,
  });

  return pool;
}

export async function closePostgresPool() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}

export async function queryCachedTitles(text: string, values: unknown[]) {
  const pool = getPostgresPool();
  const result = await pool.query<CachedTitleRow>(text, values);
  return result.rows;
}
