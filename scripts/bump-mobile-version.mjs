import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error("Usage: node scripts/bump-mobile-version.mjs <version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  console.error(`Invalid version "${nextVersion}". Expected semantic version format like 1.2.3.`);
  process.exit(1);
}

const packageJsonPath = path.join(process.cwd(), "apps/mobile/package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

if (packageJson.version === nextVersion) {
  console.log(`Mobile package version is already ${nextVersion}.`);
  process.exit(0);
}

packageJson.version = nextVersion;

await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Updated apps/mobile/package.json version to ${nextVersion}.`);
