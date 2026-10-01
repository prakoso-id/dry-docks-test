import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "../config/env.js";
import { MigrationRunner } from "./MigrationRunner.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const directory = fileURLToPath(new URL("./migrations/", import.meta.url));
const filenames = (await readdir(directory))
  .filter((filename) => /^\d+_[a-z0-9_-]+\.up\.sql$/i.test(filename))
  .sort();
const migrations = await Promise.all(filenames.map(async (filename) => ({
  name: filename.replace(/\.up\.sql$/i, ""),
  sql: await readFile(join(directory, filename), "utf8")
})));
const config = readConfig();
const connection = await mysql.createConnection({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  multipleStatements: true
});

try {
  const applied = await new MigrationRunner({ connection }).migrate(migrations);
  console.log(applied.length ? `Applied migrations: ${applied.join(", ")}` : "Database schema is up to date");
} catch (error) {
  console.error(`Migration failed${error.code ? ` (${error.code})` : ""}: ${error.sqlMessage ?? error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
