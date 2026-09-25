import { describe, it, expect, beforeAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import "dotenv/config";
import { authRoutes } from "./auth.js";
import { authenticate, requirePermission } from "../plugins/auth-guard.js";

async function buildApp() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET! });
  await app.register(authRoutes);

  app.get(
    "/admin/ping",
    { preHandler: [authenticate, requirePermission("user.manage")] },
    async () => ({ status: "ok", message: "You have user.manage permission" })
  );

  return app;
}

describe("Authentication and authorization", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  it("logs in successfully with correct admin credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "admin", password: "ChangeMe123!" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.user.roles).toContain("owner");
    expect(body.user.permissions).toContain("user.manage");
  });

  it("rejects login with an incorrect password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "admin", password: "wrongpassword" },
    });

    expect(res.statusCode).toBe(401);
    expect(res.json().error).toMatch(/invalid/i);
  });

  it("rejects login for a nonexistent username", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "doesnotexist", password: "whatever" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("blocks an admin-only route with no token (AT-10 setup)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/ping",
    });

    expect(res.statusCode).toBe(401);
  });

  it("allows admin (owner role) to access an admin-only route", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "admin", password: "ChangeMe123!" },
    });
    const { token } = loginRes.json();

    const res = await app.inject({
      method: "GET",
      url: "/admin/ping",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
  });

  it("AT-10: blocks a cashier from an admin-only route even with a valid token", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { username: "cashier1", password: "CashierPass123!" },
    });
    const { token } = loginRes.json();

    const res = await app.inject({
      method: "GET",
      url: "/admin/ping",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatch(/user\.manage/);
  });
});