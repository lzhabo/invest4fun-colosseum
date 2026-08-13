import { createDatabase } from "@invest4fun/database";
import { config as loadEnvironment } from "dotenv";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

loadEnvironment({ path: ".env.local" });
loadEnvironment({ path: ".env" });

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);
const app = createApp(database);
const server = app.listen(config.API_PORT, () => {
  process.stdout.write(
    `${JSON.stringify({ event: "api_started", port: config.API_PORT })}\n`,
  );
});

async function shutdown() {
  server.close(async () => {
    await database.close();
    process.exit(0);
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
