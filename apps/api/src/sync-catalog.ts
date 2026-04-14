import "dotenv/config";

import { env } from "./lib/env";
import { closePostgresPool } from "./lib/postgres";
import { runCatalogSync } from "./lib/catalog-sync";

async function main() {
  const result = await runCatalogSync({
    rawgApiKey: env.rawgApiKey ?? "",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...result,
      },
      null,
      2,
    ),
  );
}

void main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePostgresPool();
  });
