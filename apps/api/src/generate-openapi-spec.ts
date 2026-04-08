import "dotenv/config";

import { writeFile } from "node:fs/promises";

import { buildServer } from "./app";

async function main() {
  const server = await buildServer({ enableApiDocs: true });

  try {
    await server.ready();

    const specification = server.swagger();
    const outputUrl = new URL("../openapi.generated.json", import.meta.url);

    await writeFile(
      outputUrl,
      `${JSON.stringify(specification, null, 2)}\n`,
      "utf8",
    );
  } finally {
    await server.close();
  }
}

void main();
