import { fileURLToPath } from "node:url";
import { createDatabase } from "@invest4fun/database";
import { config as loadEnvironment } from "dotenv";
import { createApp } from "./app.js";
import { createFeedCatalog } from "./catalog.js";
import { loadConfig } from "./config.js";
import { CoinGeckoMarketDataProvider } from "./providers/market-data-provider.js";

loadEnvironment({
  path: fileURLToPath(new URL("../../../.env.local", import.meta.url)),
  override: true,
});
loadEnvironment({
  path: fileURLToPath(new URL("../../../.env", import.meta.url)),
});

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);
const app = createApp(
  database,
  createFeedCatalog(config.COINGECKO_API_KEY),
  new CoinGeckoMarketDataProvider(config.COINGECKO_API_KEY),
  new CoinGeckoMarketDataProvider(config.COINGECKO_API_KEY),
);
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
