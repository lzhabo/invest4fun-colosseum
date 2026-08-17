import { randomUUID } from "node:crypto";
import {
  basketDraftRequestSchema,
  basketReviewRequestSchema,
  marketChartPeriodSchema,
} from "@invest4fun/contracts";
import type { Database } from "@invest4fun/database";
import { PrivyClient } from "@privy-io/node";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { bootstrapAccount } from "./account-bootstrap.js";
import { feedCatalog, feedItems, ideas } from "./catalog.js";
import type { FeedCatalogProvider } from "./providers/catalog-provider.js";
import type {
  MarketChartProvider,
  MarketDetailsProvider,
} from "./providers/market-data-provider.js";

export function createApp(
  database: Database,
  catalogProvider: FeedCatalogProvider = feedCatalog,
  chartProvider?: MarketChartProvider,
  detailsProvider?: MarketDetailsProvider,
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
    const sessionId = randomUUID();
    try {
      const items = await catalogProvider.getItems();
      response.json({
        sessionId,
        generatedAt: generatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        items: orderFeedItems(items, sessionId),
      });
    } catch {
      response.status(503).json({
        error: "FEED_CATALOG_UNAVAILABLE",
        message: "The Feed catalog is temporarily unavailable.",
      });
    }
  });
  app.get("/api/feed/:assetId/details", async (request, response) => {
    if (!detailsProvider) {
      response.status(503).json({ error: "ASSET_DETAILS_UNAVAILABLE" });
      return;
    }

    const asset = feedItems.find((item) => item.id === request.params.assetId);
    if (!asset?.coingeckoId) {
      response.status(404).json({ error: "ASSET_DETAILS_NOT_FOUND" });
      return;
    }

    try {
      response.json(
        await detailsProvider.getDetails(asset.id, asset.coingeckoId),
      );
    } catch {
      response.status(503).json({ error: "ASSET_DETAILS_UNAVAILABLE" });
    }
  });
  app.get("/api/feed/:assetId/chart", async (request, response) => {
    if (!chartProvider) {
      response.status(503).json({ error: "MARKET_CHART_UNAVAILABLE" });
      return;
    }

    const asset = feedItems.find((item) => item.id === request.params.assetId);
    const period = marketChartPeriodSchema.safeParse(
      request.query.days ?? "30",
    );
    if (!asset?.coingeckoId || !period.success) {
      response.status(404).json({ error: "MARKET_CHART_NOT_FOUND" });
      return;
    }

    try {
      response.json(
        await chartProvider.getHistory(asset.coingeckoId, period.data),
      );
    } catch {
      response.status(503).json({ error: "MARKET_CHART_UNAVAILABLE" });
    }
  });
  app.get("/api/ideas", (_request, response) =>
    response.json({ items: ideas }),
  );

  app.get("/api/baskets/draft", async (request, response) => {
    const userId = await resolveInternalUserId(database, request);
    if (!userId) {
      response.status(401).json({ error: "AUTH_TOKEN_REQUIRED" });
      return;
    }

    const draft = await database.query<{
      id: string;
      status: "draft";
    }>(
      `
        select id, status
        from app.baskets
        where user_id = $1 and status = 'draft'
        order by updated_at desc
        limit 1
      `,
      [userId],
    );
    if (!draft.rows[0]) return response.json({ basket: null });

    return response.json({
      basket: await readDraftBasket(database, draft.rows[0].id),
    });
  });

  app.put("/api/baskets/draft", async (request, response) => {
    const userId = await resolveInternalUserId(database, request);
    if (!userId) {
      response.status(401).json({ error: "AUTH_TOKEN_REQUIRED" });
      return;
    }

    const parsed = basketDraftRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_BASKET_DRAFT",
        message: "Basket items and amounts are invalid.",
      });
      return;
    }

    const resolvedItems = parsed.data.items.map((item) => {
      const catalogItem =
        item.kind === "asset"
          ? feedItems.find((asset) => asset.id === item.id)
          : ideas.find((idea) => idea.id === item.id);
      return catalogItem
        ? {
            ...item,
            title:
              item.kind === "asset"
                ? (catalogItem as (typeof feedItems)[number]).name
                : (catalogItem as (typeof ideas)[number]).title,
            amountCents: Math.round(item.amountUsd * 100),
          }
        : null;
    });

    if (resolvedItems.some((item) => item === null)) {
      response.status(400).json({
        error: "BASKET_ITEM_NOT_ELIGIBLE",
        message: "One or more basket items are no longer eligible.",
      });
      return;
    }

    const validItems = resolvedItems.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
    const existing = await database.query<{ id: string }>(
      `
        select id
        from app.baskets
        where user_id = $1 and status = 'draft'
        order by updated_at desc
        limit 1
      `,
      [userId],
    );
    const basketId =
      existing.rows[0]?.id ??
      (
        await database.query<{ id: string }>(
          `insert into app.baskets (user_id, status) values ($1, 'draft') returning id`,
          [userId],
        )
      ).rows[0]?.id;

    if (!basketId) {
      response.status(500).json({ error: "BASKET_DRAFT_SAVE_FAILED" });
      return;
    }

    await database.query(`delete from app.basket_items where basket_id = $1`, [
      basketId,
    ]);
    for (const item of validItems) {
      await database.query(
        `
          insert into app.basket_items
            (basket_id, source_kind, source_id, title_snapshot, amount_cents)
          values ($1, $2, $3, $4, $5)
        `,
        [basketId, item.kind, item.id, item.title, item.amountCents],
      );
    }
    await database.query(
      `update app.baskets set updated_at = now() where id = $1`,
      [basketId],
    );

    return response.json({ basket: await readDraftBasket(database, basketId) });
  });

  app.post("/api/baskets/review", async (request, response) => {
    const userId = await resolveInternalUserId(database, request);
    if (!userId) {
      response.status(401).json({ error: "AUTH_TOKEN_REQUIRED" });
      return;
    }

    const parsed = basketReviewRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: "INVALID_BASKET",
        message: "Basket items and amounts are invalid.",
      });
      return;
    }

    const idempotencyKey = request.header("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length > 120) {
      response.status(400).json({ error: "IDEMPOTENCY_KEY_REQUIRED" });
      return;
    }

    const resolvedItems = parsed.data.items.map((item) => {
      const catalogItem =
        item.kind === "asset"
          ? feedItems.find((asset) => asset.id === item.id)
          : ideas.find((idea) => idea.id === item.id);
      return catalogItem
        ? {
            ...item,
            title:
              item.kind === "asset"
                ? (catalogItem as (typeof feedItems)[number]).name
                : (catalogItem as (typeof ideas)[number]).title,
            amountCents: Math.round(item.amountUsd * 100),
          }
        : null;
    });

    if (resolvedItems.some((item) => item === null)) {
      response.status(400).json({
        error: "BASKET_ITEM_NOT_ELIGIBLE",
        message: "One or more basket items are no longer eligible.",
      });
      return;
    }
    const validItems = resolvedItems.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );

    const existingOrder = await database.query<{
      order_id: string;
      order_status: "draft";
      basket_id: string;
    }>(
      `
        select o.id as order_id, o.status as order_status, o.basket_id
        from app.orders o
        where o.user_id = $1 and o.idempotency_key = $2
      `,
      [userId, idempotencyKey],
    );
    if (existingOrder.rows[0]) {
      const existing = existingOrder.rows[0];
      const existingItems = await database.query<{
        source_kind: "asset" | "idea";
        source_id: string;
        title_snapshot: string;
        amount_cents: number;
      }>(
        `select source_kind, source_id, title_snapshot, amount_cents from app.basket_items where basket_id = $1 order by created_at asc`,
        [existing.basket_id],
      );
      return response.json({
        basket: {
          id: existing.basket_id,
          status: "draft",
          totalUsd:
            existingItems.rows.reduce(
              (total, item) => total + item.amount_cents,
              0,
            ) / 100,
          items: existingItems.rows.map((item) => ({
            id: item.source_id,
            kind: item.source_kind,
            title: item.title_snapshot,
            amountUsd: item.amount_cents / 100,
          })),
        },
        order: {
          id: existing.order_id,
          status: existing.order_status,
          idempotencyKey,
        },
      });
    }

    const draftBasket = await database.query<{ id: string }>(
      `
        select id
        from app.baskets
        where user_id = $1 and status = 'draft'
        order by updated_at desc
        limit 1
      `,
      [userId],
    );
    const basket = draftBasket.rows[0]
      ? draftBasket
      : await database.query<{ id: string }>(
          `insert into app.baskets (user_id, status) values ($1, 'draft') returning id`,
          [userId],
        );
    const basketId = basket.rows[0]?.id;
    if (!basketId) {
      response.status(500).json({ error: "BASKET_CREATE_FAILED" });
      return;
    }

    await database.query(`delete from app.basket_items where basket_id = $1`, [
      basketId,
    ]);
    for (const item of validItems) {
      await database.query(
        `
          insert into app.basket_items
            (basket_id, source_kind, source_id, title_snapshot, amount_cents)
          values ($1, $2, $3, $4, $5)
        `,
        [basketId, item.kind, item.id, item.title, item.amountCents],
      );
    }
    await database.query(
      `update app.baskets set updated_at = now() where id = $1`,
      [basketId],
    );

    const order = await database.query<{ id: string }>(
      `
        insert into app.orders (user_id, basket_id, status, idempotency_key)
        values ($1, $2, 'draft', $3)
        returning id
      `,
      [userId, basketId, idempotencyKey],
    );
    const orderId = order.rows[0]?.id;
    if (!orderId) {
      response.status(500).json({ error: "ORDER_CREATE_FAILED" });
      return;
    }

    response.status(201).json({
      basket: {
        id: basketId,
        status: "draft",
        totalUsd:
          validItems.reduce((total, item) => total + item.amountCents, 0) / 100,
        items: validItems.map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title,
          amountUsd: item.amountCents / 100,
        })),
      },
      order: { id: orderId, status: "draft", idempotencyKey },
    });
  });

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

async function readDraftBasket(database: Database, basketId: string) {
  const items = await database.query<{
    source_kind: "asset" | "idea";
    source_id: string;
    title_snapshot: string;
    amount_cents: number;
  }>(
    `
      select source_kind, source_id, title_snapshot, amount_cents
      from app.basket_items
      where basket_id = $1
      order by created_at asc
    `,
    [basketId],
  );

  return {
    id: basketId,
    status: "draft" as const,
    totalUsd:
      items.rows.reduce((total, item) => total + item.amount_cents, 0) / 100,
    items: items.rows.map((item) => ({
      id: item.source_id,
      kind: item.source_kind,
      title: item.title_snapshot,
      amountUsd: item.amount_cents / 100,
    })),
  };
}

function orderFeedItems(items: typeof feedItems, seed: string) {
  return [...items].sort(
    (left, right) => feedOrderKey(seed, left.id) - feedOrderKey(seed, right.id),
  );
}

function feedOrderKey(seed: string, id: string) {
  let hash = 2166136261;
  for (const character of `${seed}:${id}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function resolveInternalUserId(
  database: Database,
  request: express.Request,
): Promise<string | null> {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const authorization = request.header("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : undefined;
  if (!appId || !appSecret || !accessToken) return null;

  try {
    const privy = new PrivyClient({ appId, appSecret });
    const claims = await privy.utils().auth().verifyAuthToken(accessToken);
    const result = await database.query<{ id: string }>(
      `
        select u.id
        from app.users u
        join app.auth_identities i on i.user_id = u.id
        where i.provider = 'privy' and i.external_subject = $1 and u.status = 'active'
      `,
      [claims.user_id],
    );
    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}
