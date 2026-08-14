import type { Database } from "@invest4fun/database";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

function database(ping: () => Promise<void>): Database {
  return { ping, query: vi.fn(), close: vi.fn() };
}

describe("service probes", () => {
  it("reports liveness without requiring the database", async () => {
    const response = await request(createApp(database(vi.fn()))).get(
      "/api/health",
    );
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ service: "api", status: "ok" });
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
});
