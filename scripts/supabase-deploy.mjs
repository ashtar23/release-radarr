import { spawnSync } from "node:child_process";

const [, , environment, action] = process.argv;

const VALID_ENVIRONMENTS = new Set(["staging", "prod"]);
const VALID_ACTIONS = new Set(["functions", "db", "all"]);

if (!VALID_ENVIRONMENTS.has(environment) || !VALID_ACTIONS.has(action)) {
  printUsageAndExit();
}

const environmentPrefix = environment.toUpperCase();
const projectRef = process.env[`SUPABASE_${environmentPrefix}_PROJECT_REF`];
const dbPassword = process.env[`SUPABASE_${environmentPrefix}_DB_PASSWORD`];

if (!projectRef) {
  fail(
    `Missing SUPABASE_${environmentPrefix}_PROJECT_REF. Export it before running this script.`,
  );
}

const needsDatabaseAccess = action === "db" || action === "all";

runSupabaseCommand(getLinkCommand(projectRef, dbPassword, needsDatabaseAccess));

if (action === "db" || action === "all") {
  runSupabaseCommand(["db", "push"]);
}

if (action === "functions" || action === "all") {
  runSupabaseCommand(["functions", "deploy", "api"]);
}

function getLinkCommand(projectRef, dbPassword, needsDatabaseAccess) {
  const command = ["link", "--project-ref", projectRef];

  if (needsDatabaseAccess) {
    if (!dbPassword) {
      fail(
        `Missing SUPABASE_${environmentPrefix}_DB_PASSWORD. Export it before running database deploy commands.`,
      );
    }

    command.push("--password", dbPassword);
  }

  return command;
}

function runSupabaseCommand(args) {
  const result = spawnSync("supabase", args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printUsageAndExit() {
  console.error(
    [
      "Usage: node scripts/supabase-deploy.mjs <staging|prod> <functions|db|all>",
      "",
      "Required env vars:",
      "  SUPABASE_<ENV>_PROJECT_REF",
      "",
      "Additional env vars for db/all:",
      "  SUPABASE_<ENV>_DB_PASSWORD",
    ].join("\n"),
  );
  process.exit(1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
