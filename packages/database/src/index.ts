import { Pool } from "pg";

export interface Database {
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabase(connectionString: string): Database {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: true },
  });

  return {
    async ping() {
      await pool.query("select 1");
    },
    async close() {
      await pool.end();
    },
  };
}
