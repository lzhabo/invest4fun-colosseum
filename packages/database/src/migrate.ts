import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const migrationsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);
const pool = new Pool({ connectionString });

try {
  await pool.query("create schema if not exists _infra");
  await pool.query(`
    create table if not exists _infra.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrationNames = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of migrationNames) {
    const applied = await pool.query(
      "select 1 from _infra.schema_migrations where name = $1",
      [name],
    );
    if (applied.rowCount) continue;

    const sql = await readFile(path.join(migrationsDirectory, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into _infra.schema_migrations (name) values ($1)",
        [name],
      );
      await client.query("commit");
      process.stdout.write(`Applied ${name}\n`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
