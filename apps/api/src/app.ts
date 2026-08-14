import type { Database } from "@invest4fun/database";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { feedItems, ideas } from "./catalog.js";

export function createApp(database: Database) {
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

  app.get("/api/feed", (_request, response) =>
    response.json({ items: feedItems }),
  );
  app.get("/api/ideas", (_request, response) =>
    response.json({ items: ideas }),
  );

  return app;
}
