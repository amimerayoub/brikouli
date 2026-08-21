import { readFile, writeFile } from "node:fs/promises";

const [migrationName, sourcePath] = process.argv.slice(2);

if (!migrationName || !sourcePath) {
  throw new Error("Usage: node build-supabase-migration-input.mjs <migration-name> <source-path>");
}

const query = await readFile(sourcePath, "utf8");

await writeFile(
  "/tmp/brikouli-phase2-migration.json",
  JSON.stringify({
    project_id: "erwtygmftpgdtyabawsg",
    name: migrationName,
    query,
  }),
);
