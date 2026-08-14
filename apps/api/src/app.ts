import { randomUUID } from "node:crypto";
import type { Database } from "@invest4fun/database";
import { PrivyClient } from "@privy-io/node";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { bootstrapAccount } from "./account-bootstrap.js";
import { feedCatalog, ideas } from "./catalog.js";
import type { FeedCatalogProvider } from "./providers/catalog-provider.js";

export function createApp(
  database: Database,
  catalogProvider: FeedCatalogProvider = feedCatalog,
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "64kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/api/health", (_request, response) => {
    response.json({
      service: "api",
      status: "ok",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/ready", async (_request, response) => {
    try {
      await database.ping();
      response.json({
        service: "api",
        status: "ok",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        checks: { database: "ok" },
      });
    } catch {
      response.status(503).json({
        service: "api",
        status: "degraded",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        checks: { database: "unavailable" },
      });
    }
  });

  app.get("/api/feed", async (_request, response) => {
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 60_000);
    try {
      const items = await catalogProvider.getItems();
      response.json({
        sessionId: randomUUID(),
        generatedAt: generatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        items,
      });
    } catch {
      response.status(503).json({
        error: "FEED_CATALOG_UNAVAILABLE",
        message: "The Feed catalog is temporarily unavailable.",
      });
    }
  });
  app.get("/api/ideas", (_request, response) =>
    response.json({ items: ideas }),
  );

  app.post("/api/auth/bootstrap", async (request, response) => {
    const appId = process.env.PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    const authorization = request.header("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : undefined;

    if (!appId || !appSecret) {
      response.status(503).json({
        error: "PRIVY_SERVER_NOT_CONFIGURED",
        message: "Privy server credentials are not configured.",
      });
      return;
    }
    if (!accessToken) {
      response.status(401).json({ error: "AUTH_TOKEN_REQUIRED" });
      return;
    }

    try {
      const privy = new PrivyClient({ appId, appSecret });
      const claims = await privy.utils().auth().verifyAuthToken(accessToken);
      const account = await bootstrapAccount(database, privy, claims.user_id);
      response.json(account);
    } catch {
      response.status(401).json({ error: "INVALID_AUTH_TOKEN" });
    }
  });

  return app;
}
