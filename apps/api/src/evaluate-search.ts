import { closePostgresPool } from "./lib/postgres";
import { searchTitles } from "./lib/search";

const DEFAULT_QUERIES = [
  "spiderman",
  "god of war",
  "gow ragnarok",
  "marvel",
  "zelda",
  "naughty dog",
];

void main();

async function main() {
  const args = process.argv.slice(2);
  const queries = args.filter((value) => !value.startsWith("--"));
  const forceRefresh = args.includes("--force-refresh");
  const limit = readNumericArg(args, "--limit", 5);

  const targetQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

  try {
    for (const query of targetQueries) {
      const result = await searchTitles({
        query,
        page: 1,
        limit,
        forceRefresh,
      });

      console.log(`\n# ${query}`);
      console.log(
        `servedBy=${result.servedBy ?? "local-cache"} decision=${result.decisionReason ?? "n/a"} total=${result.totalCount}`,
      );

      result.results.forEach((item, index) => {
        const quality = [
          item.rawgMetacritic != null ? `mc:${item.rawgMetacritic}` : null,
          item.rawgRating != null ? `rt:${item.rawgRating}` : null,
          item.rawgRatingsCount != null ? `rc:${item.rawgRatingsCount}` : null,
          item.rawgAdded != null ? `ad:${item.rawgAdded}` : null,
        ]
          .filter(Boolean)
          .join(" ");

        console.log(
          `${index + 1}. ${item.name} [${item.id}] ${quality}`.trim(),
        );
      });
    }
  } finally {
    await closePostgresPool();
  }
}

function readNumericArg(args: string[], flag: string, fallback: number) {
  const prefixed = `${flag}=`;
  const inline = args.find((value) => value.startsWith(prefixed));
  const rawValue = inline ? inline.slice(prefixed.length) : null;
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
