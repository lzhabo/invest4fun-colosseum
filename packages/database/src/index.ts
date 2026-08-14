import { Pool } from "pg";

export type Queryable = Pick<Pool, "query">;

export interface Database {
  ping(): Promise<void>;
  close(): Promise<void>;
  query<T extends object = object>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
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
    async query<T extends object = object>(
      text: string,
      values?: readonly unknown[],
    ) {
      const result = await pool.query<T>(text, values as unknown[] | undefined);
      return { rows: result.rows, rowCount: result.rowCount };
    },
    async close() {
      await pool.end();
    },
  };
}
