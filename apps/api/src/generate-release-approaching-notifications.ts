import "dotenv/config";

import { closePostgresPool } from "./lib/postgres";
import { generateReleaseApproachingNotifications } from "./lib/notification-generation";

async function main() {
  const runDate = parseRunDateArg(process.argv.slice(2));
  const result = await generateReleaseApproachingNotifications({ runDate });

  console.log(
    JSON.stringify(
      {
        ok: true,
        runDate: result.runDate,
        insertedRecordCount: result.insertedRecordCount,
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

function parseRunDateArg(args: string[]) {
  const runDateArg = args.find((arg) => arg.startsWith("--run-date="));
  if (!runDateArg) {
    return undefined;
  }

  const [, value = ""] = runDateArg.split("=", 2);
  return value.trim() || undefined;
}
