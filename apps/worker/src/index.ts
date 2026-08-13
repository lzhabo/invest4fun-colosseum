import { createDatabase } from "@invest4fun/database";
import { config as loadEnvironment } from "dotenv";
import { z } from "zod";

loadEnvironment({ path: ".env.local" });
loadEnvironment({ path: ".env" });

const config = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1)
      .default("postgresql://invest4fun:invest4fun@localhost:5432/invest4fun"),
    WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(5_000).default(30_000),
  })
  .parse(process.env);

const database = createDatabase(config.DATABASE_URL);

async function heartbeat() {
  try {
    await database.ping();
    process.stdout.write(
      `${JSON.stringify({ event: "worker_heartbeat", database: "ok" })}\n`,
    );
  } catch {
    process.stderr.write(
      `${JSON.stringify({ event: "worker_heartbeat", database: "unavailable" })}\n`,
    );
  }
}

await heartbeat();
const timer = setInterval(heartbeat, config.WORKER_POLL_INTERVAL_MS);

async function shutdown() {
  clearInterval(timer);
  await database.close();
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
