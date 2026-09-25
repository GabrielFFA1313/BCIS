import { describe, it, expect, beforeAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import "dotenv/config";
import { authRoutes } from "./auth.js";
import { planRoutes } from "./plans.js";
import { subscriberRoutes } from "./subscribers.js";
import { serviceAccountRoutes } from "./service-accounts.js";

async function buildApp() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET! });
  await app.register(authRoutes);
  await app.register(planRoutes);
  await app.register(subscriberRoutes);
  await app.register(serviceAccountRoutes);
  return app;
}

async function loginAsAdmin(app: Awaited<ReturnType<typeof buildApp>>) {
  const res = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { username: "admin", password: "ChangeMe123!" },
  });
  return res.json().token as string;
}

describe("Subscribers and Service Accounts business rules", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let token: string;

  beforeAll(async () => {
    app = await buildApp();
    token = await loginAsAdmin(app);
  });

  it("rejects creating a subscriber with a duplicate account number", async () => {
    const accountNumber = `TEST-DUP-${Date.now()}`;

    const first = await app.inject({
      method: "POST",
      url: "/subscribers",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        accountNumber,
        fullName: "First Subscriber",
        addressLine: "Test Address 1",
      },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/subscribers",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        accountNumber, // same account number again
        fullName: "Second Subscriber",
        addressLine: "Test Address 2",
      },
    });

    // should NOT succeed - the unique constraint must reject this
    expect(second.statusCode).not.toBe(201);
  });

  it("preserves a service account's currentRate after the plan's price later changes", async () => {
    // create a dedicated test plan
    const planRes = await app.inject({
      method: "POST",
      url: "/plans",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        code: `TEST-PLAN-${Date.now()}`,
        name: "Test Rate Lock Plan",
        type: "internet",
        price: 500,
        speedMbps: 10,
      },
    });
    expect(planRes.statusCode).toBe(201);
    const plan = planRes.json();

    // create a dedicated test subscriber
    const subRes = await app.inject({
      method: "POST",
      url: "/subscribers",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        accountNumber: `TEST-SUB-${Date.now()}`,
        fullName: "Rate Lock Test Subscriber",
        addressLine: "Test Address",
      },
    });
    expect(subRes.statusCode).toBe(201);
    const subscriber = subRes.json();

    // create a service account under that plan
    const saRes = await app.inject({
      method: "POST",
      url: `/subscribers/${subscriber.id}/service-accounts`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        serviceAccountNumber: `TEST-SA-${Date.now()}`,
        planId: plan.id,
        installationAddress: "Test Address",
      },
    });
    expect(saRes.statusCode).toBe(201);
    const serviceAccount = saRes.json();

    // confirm it copied the plan's price at creation time
    expect(serviceAccount.currentRate).toBe("500.00");

    // now change the plan's price
    const updateRes = await app.inject({
      method: "PATCH",
      url: `/plans/${plan.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { price: 999 },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.json().price).toBe("999.00");

    // the EXISTING service account's rate must be unaffected
    const recheckRes = await app.inject({
      method: "GET",
      url: `/service-accounts/${serviceAccount.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(recheckRes.json().currentRate).toBe("500.00"); // unchanged, not 999.00
  });
});