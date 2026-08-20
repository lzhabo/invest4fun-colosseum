import type { AccountBootstrapResponse } from "@invest4fun/contracts";
import type { Database } from "@invest4fun/database";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { bootstrapAccount } from "./account-bootstrap.js";
import { type AuthProvider, AuthTokenError, createApp } from "./app.js";
import { feedItems, ideas } from "./catalog.js";

function database(ping: () => Promise<void>, query = vi.fn()): Database {
  return { ping, query, close: vi.fn() };
}

function authProvider(overrides: Partial<AuthProvider> = {}): AuthProvider {
  const account: AccountBootstrapResponse = {
    user: { id: "11111111-1111-4111-8111-111111111111", status: "active" },
    identity: { provider: "privy", externalSubject: "privy-user" },
    wallets: [],
  };
  return {
    configured: () => true,
    bootstrap: vi.fn(async () => account),
    resolveActiveUserId: vi.fn(
      async () => "11111111-1111-4111-8111-111111111111",
    ),
    ...overrides,
  };
}

describe("service probes", () => {
  it("reports liveness without requiring the database", async () => {
    const response = await request(createApp(database(vi.fn()))).get(
      "/api/health",
    );
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ service: "api", status: "ok" });
    expect(response.header["x-request-id"]).toBeTruthy();
  });

  it("reports unavailable when the database is down", async () => {
    const response = await request(
      createApp(
        database(async () => {
          throw new Error("offline");
        }),
      ),
    ).get("/api/ready");
    expect(response.status).toBe(503);
    expect(response.body.checks.database).toBe("unavailable");
  });

  it("preserves caller request IDs for traceability", async () => {
    const response = await request(createApp(database(vi.fn())))
      .get("/api/health")
      .set("X-Request-Id", "request-from-client");

    expect(response.status).toBe(200);
    expect(response.header["x-request-id"]).toBe("request-from-client");
  });
});

describe("auth bootstrap", () => {
  it("rejects bootstrap when Privy server credentials are not configured", async () => {
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider({ configured: () => false }),
      ),
    )
      .post("/api/auth/bootstrap")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("PRIVY_SERVER_NOT_CONFIGURED");
    expect(response.body.requestId).toBeTruthy();
  });

  it("requires a bearer token for bootstrap", async () => {
    const bootstrap = vi.fn();
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider({ bootstrap }),
      ),
    )
      .post("/api/auth/bootstrap")
      .set("X-Request-Id", "missing-token-request");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("AUTH_TOKEN_REQUIRED");
    expect(response.body.requestId).toBe("missing-token-request");
    expect(bootstrap).not.toHaveBeenCalled();
  });

  it("bootstraps from a verified auth provider identity", async () => {
    const account: AccountBootstrapResponse = {
      user: { id: "11111111-1111-4111-8111-111111111111", status: "active" },
      identity: { provider: "privy", externalSubject: "privy-user" },
      wallets: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          chain: "solana",
          address: "So11111111111111111111111111111111111111112",
          role: "embedded",
          provider: "privy",
          label: null,
          active: true,
        },
      ],
    };
    const bootstrap = vi.fn(async () => account);

    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider({ bootstrap }),
      ),
    )
      .post("/api/auth/bootstrap")
      .set("Authorization", "Bearer verified-token");

    expect(response.status).toBe(200);
    expect(bootstrap).toHaveBeenCalledWith("verified-token");
    expect(response.body).toEqual(account);
  });

  it("returns invalid token when the auth provider rejects bootstrap", async () => {
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider({
          bootstrap: vi.fn(async () => {
            throw new AuthTokenError();
          }),
        }),
      ),
    )
      .post("/api/auth/bootstrap")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("INVALID_AUTH_TOKEN");
  });

  it("returns unavailable when account bootstrap persistence fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider({
          bootstrap: vi.fn(async () => {
            throw new Error("database offline");
          }),
        }),
      ),
    )
      .post("/api/auth/bootstrap")
      .set("Authorization", "Bearer verified-token");

    expect(response.status).toBe(503);
    expect(response.body.error).toBe("ACCOUNT_BOOTSTRAP_UNAVAILABLE");
    expect(response.body.requestId).toBeTruthy();
    consoleError.mockRestore();
  });

  it("resolves basket access from the verified token, not forged headers", async () => {
    const verifiedUserId = "11111111-1111-4111-8111-111111111111";
    const query = vi.fn(async () => ({ rows: [], rowCount: 0 }));
    const resolveActiveUserId = vi.fn(async () => verifiedUserId);

    const response = await request(
      createApp(
        database(vi.fn(), query),
        undefined,
        undefined,
        undefined,
        authProvider({ resolveActiveUserId }),
      ),
    )
      .get("/api/baskets/draft")
      .set("Authorization", "Bearer verified-token")
      .set("x-user-id", "99999999-9999-4999-8999-999999999999");

    expect(response.status).toBe(200);
    expect(resolveActiveUserId).toHaveBeenCalledWith("verified-token");
    expect(query).toHaveBeenCalledWith(expect.any(String), [verifiedUserId]);
    expect(response.body).toEqual({ basket: null });
  });

  it("rejects non-executable placeholder assets during basket review", async () => {
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .post("/api/baskets/review")
      .set("Authorization", "Bearer verified-token")
      .set("Idempotency-Key", "r2-placeholder-safety")
      .send({
        items: [
          {
            id: "product-placeholder:clmt",
            kind: "asset",
            amountUsd: 50,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("BASKET_ITEM_NOT_ELIGIBLE");
  });

  it("rejects non-executable placeholder assets during basket draft save", async () => {
    const response = await request(
      createApp(
        database(vi.fn()),
        undefined,
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .put("/api/baskets/draft")
      .set("Authorization", "Bearer verified-token")
      .send({
        items: [
          {
            id: "product-placeholder:clmt",
            kind: "asset",
            amountUsd: 50,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("BASKET_ITEM_NOT_ELIGIBLE");
  });

  it("uses the injected catalog provider for basket eligibility", async () => {
    const executableAsset = feedItems.find(
      (item) => item.eligibility.executable,
    );
    if (!executableAsset) throw new Error("EXECUTABLE_FIXTURE_MISSING");
    const query = vi.fn(async (text: string) => {
      if (text.includes("insert into app.baskets")) {
        return {
          rows: [{ id: "44444444-4444-4444-8444-444444444444" }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const response = await request(
      createApp(
        database(vi.fn(), query),
        {
          getItems: vi.fn(async () => [
            {
              ...executableAsset,
              eligibility: {
                ...executableAsset.eligibility,
                tradable: false as const,
                executable: false as const,
                reasonCodes: ["provider_disabled"],
              },
            },
          ]),
        },
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .put("/api/baskets/draft")
      .set("Authorization", "Bearer verified-token")
      .send({
        items: [{ id: executableAsset.id, kind: "asset", amountUsd: 50 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("BASKET_ITEM_NOT_ELIGIBLE");
    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining("insert into app.basket_items"),
      expect.anything(),
    );
  });

  it("returns versioned investment ideas", async () => {
    const response = await request(createApp(database(vi.fn()))).get(
      "/api/ideas",
    );

    expect(response.status).toBe(200);
    expect(response.body.items[0]).toMatchObject({
      id: "steady-start",
      status: "active",
      minimumInvestmentCents: 1000,
      version: {
        id: "steady-start:v1",
        totalWeightBps: 10000,
      },
    });
    expect(response.body.items[0].version.components[0]).toMatchObject({
      assetId: expect.stringMatching(/^solana:/),
      weightBps: 10000,
      order: 0,
    });
  });

  it("rejects ideas with non-executable holdings during basket review", async () => {
    const selectedIdea = ideas[0];
    const component = selectedIdea?.version.components[0];
    if (!selectedIdea || !component) throw new Error("IDEA_FIXTURE_MISSING");
    const disabledCatalog = feedItems.map((asset) =>
      asset.id === component.assetId
        ? {
            ...asset,
            eligibility: {
              ...asset.eligibility,
              tradable: false as const,
              executable: false as const,
              reasonCodes: ["provider_disabled"],
            },
          }
        : asset,
    );
    const response = await request(
      createApp(
        database(vi.fn()),
        { getItems: vi.fn(async () => disabledCatalog) },
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .post("/api/baskets/review")
      .set("Authorization", "Bearer verified-token")
      .set("Idempotency-Key", "r3-idea-holding-safety")
      .send({
        items: [{ id: selectedIdea.id, kind: "idea", amountUsd: 50 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("BASKET_ITEM_NOT_ELIGIBLE");
  });

  it("rejects ideas whose holdings are absent from the injected catalog", async () => {
    const selectedIdea = ideas[0];
    if (!selectedIdea) throw new Error("IDEA_FIXTURE_MISSING");
    const response = await request(
      createApp(
        database(vi.fn()),
        { getItems: vi.fn(async () => []) },
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .put("/api/baskets/draft")
      .set("Authorization", "Bearer verified-token")
      .send({
        items: [{ id: selectedIdea.id, kind: "idea", amountUsd: 50 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("BASKET_ITEM_NOT_ELIGIBLE");
  });

  it("stores selected idea version and snapshot during basket draft save", async () => {
    const selectedIdea = ideas[0];
    if (!selectedIdea) throw new Error("IDEA_FIXTURE_MISSING");
    const insertValues: (readonly unknown[])[] = [];
    const query = vi.fn(async (text: string, values?: readonly unknown[]) => {
      if (text.includes("insert into app.baskets")) {
        return {
          rows: [{ id: "44444444-4444-4444-8444-444444444444" }],
          rowCount: 1,
        };
      }
      if (text.includes("insert into app.basket_items")) {
        insertValues.push(values ?? []);
      }
      if (text.includes("select source_kind")) {
        return {
          rows: [
            {
              source_kind: "idea",
              source_id: selectedIdea.id,
              title_snapshot: selectedIdea.title,
              amount_cents: 5000,
            },
          ],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 1 };
    });

    const response = await request(
      createApp(
        database(vi.fn(), query),
        undefined,
        undefined,
        undefined,
        authProvider(),
      ),
    )
      .put("/api/baskets/draft")
      .set("Authorization", "Bearer verified-token")
      .send({
        items: [{ id: selectedIdea.id, kind: "idea", amountUsd: 50 }],
      });

    expect(response.status).toBe(200);
    expect(insertValues[0]?.[3]).toBe(selectedIdea.version.id);
    expect(JSON.parse(String(insertValues[0]?.[5]))).toMatchObject({
      type: "idea",
      ideaId: selectedIdea.id,
      ideaVersionId: selectedIdea.version.id,
      components: [
        {
          assetId: selectedIdea.version.components[0]?.assetId,
          weightBps: selectedIdea.version.components[0]?.weightBps,
        },
      ],
    });
  });
});

describe("account bootstrap persistence", () => {
  it("upserts one internal user and maps Privy Solana wallets by role", async () => {
    const walletWrites: unknown[][] = [];
    const walletQueries: string[] = [];
    const lifecycleQueries: string[] = [];
    const query = vi.fn(async (text: string, values?: readonly unknown[]) => {
      if (text.includes("select u.id, u.status")) {
        return {
          rows: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              status: "active",
            },
          ],
          rowCount: 1,
        };
      }
      if (text.includes("update app.wallets")) {
        lifecycleQueries.push(text);
        return { rows: [], rowCount: 1 };
      }
      if (text.includes("insert into app.wallets")) {
        walletQueries.push(text);
        walletWrites.push([...(values ?? [])]);
        return { rows: [], rowCount: 1 };
      }
      if (text.includes("select id, chain, address, role")) {
        return {
          rows: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              chain: "solana",
              address: "So11111111111111111111111111111111111111112",
              role: "embedded",
              custody_provider: "privy",
              label: "Privy wallet",
              is_active: true,
            },
            {
              id: "33333333-3333-4333-8333-333333333333",
              chain: "solana",
              address: "Ex11111111111111111111111111111111111111112",
              role: "external",
              custody_provider: "privy",
              label: "Phantom",
              is_active: true,
            },
          ],
          rowCount: 2,
        };
      }
      return { rows: [], rowCount: 1 };
    });
    const privy = {
      users: () => ({
        _get: vi.fn(async () => ({
          linked_accounts: [
            {
              type: "wallet",
              chain_type: "solana",
              address: "So11111111111111111111111111111111111111112",
              wallet_client_type: "privy",
              meta: { name: "Privy wallet" },
            },
            {
              type: "wallet",
              chain_type: "solana",
              address: "Ex11111111111111111111111111111111111111112",
              wallet_client_type: "phantom",
              meta: { name: "Phantom" },
            },
            {
              type: "wallet",
              chain_type: "ethereum",
              address: "0x0000000000000000000000000000000000000000",
            },
          ],
        })),
      }),
    };

    const account = await bootstrapAccount(
      database(vi.fn(), query),
      privy,
      "privy-user",
    );

    expect(account.user.id).toBe("11111111-1111-4111-8111-111111111111");
    expect(account.identity).toEqual({
      provider: "privy",
      externalSubject: "privy-user",
    });
    expect(walletWrites).toEqual([
      [
        "11111111-1111-4111-8111-111111111111",
        "So11111111111111111111111111111111111111112",
        "embedded",
        "Privy wallet",
        true,
      ],
      [
        "11111111-1111-4111-8111-111111111111",
        "Ex11111111111111111111111111111111111111112",
        "external",
        "Phantom",
        true,
      ],
    ]);
    expect(account.wallets.map((wallet) => wallet.role)).toEqual([
      "embedded",
      "external",
    ]);
    expect(lifecycleQueries).toEqual([
      expect.stringContaining("role = 'embedded'"),
      expect.stringContaining("role = 'external'"),
    ]);
    expect(walletQueries).toEqual([
      expect.stringContaining("where app.wallets.user_id = excluded.user_id"),
      expect.stringContaining("where app.wallets.user_id = excluded.user_id"),
    ]);
  });
});
