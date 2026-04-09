import "dotenv/config";

import { env } from "./lib/env";
import { closePostgresPool } from "./lib/postgres";
import { syncHomeDiscovery } from "./lib/home-sync";

async function main() {
  const runDate = parseRunDateArg(process.argv.slice(2));
  const result = await syncHomeDiscovery({
    rawgApiKey: env.rawgApiKey ?? "",
    runDate,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        runDate: result.runDate,
        candidateCounts: result.candidateCounts,
        uniqueCandidateCount: result.uniqueCandidateCount,
        enrichedCandidateCount: result.enrichedCandidateCount,
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
