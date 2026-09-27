import { describe, it, expect, beforeAll } from "vitest";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import "dotenv/config";
import { authRoutes } from "./auth.js";
import { planRoutes } from "./plans.js";
import { subscriberRoutes } from "./subscribers.js";
import { serviceAccountRoutes } from "./service-accounts.js";
import { billingRoutes } from "./billing.js";

async function buildApp() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET! });
  await app.register(authRoutes);
  await app.register(planRoutes);
  await app.register(subscriberRoutes);
  await app.register(serviceAccountRoutes);
  await app.register(billingRoutes);
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

describe("Billing engine", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let token: string;
  const testRunYear = 2050 + (Date.now() % 40);

  function shortId() {
    return Math.random().toString(36).slice(2, 8); // 6-char alphanumeric, e.g. "a1b2c3"
  }

  beforeAll(async () => {
    app = await buildApp();
    token = await loginAsAdmin(app);
  });

    async function createTestPlanAndAccount(rate: number) {
      const planRes = await app.inject({
        method: "POST",
        url: "/plans",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          code: `BT-${shortId()}`,
          name: "Billing Test Plan",
          type: "internet",
          price: rate,
          speedMbps: 10,
        },
      });
      if (planRes.statusCode !== 201) {
        throw new Error(`Plan creation failed (${planRes.statusCode}): ${planRes.body}`);
      }
      const plan = planRes.json();

      const subRes = await app.inject({
        method: "POST",
        url: "/subscribers",
        headers: { authorization: `Bearer ${token}` },
        payload: {
          accountNumber: `BS-${shortId()}`,
          fullName: "Billing Test Subscriber",
          addressLine: "Test Address",
        },
      });
      if (subRes.statusCode !== 201) {
        throw new Error(`Subscriber creation failed (${subRes.statusCode}): ${subRes.body}`);
      }
      const subscriber = subRes.json();

      const saRes = await app.inject({
        method: "POST",
        url: `/subscribers/${subscriber.id}/service-accounts`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          serviceAccountNumber: `BSA-${shortId()}`,
          planId: plan.id,
          installationAddress: "Test Address",
        },
      });
      if (saRes.statusCode !== 201) {
        throw new Error(`Service account creation failed (${saRes.statusCode}): ${saRes.body}`);
      }
      const serviceAccount = saRes.json();

      return { plan, subscriber, serviceAccount };
    }

  it("AT-11: running billing generation twice for the same period creates no duplicate invoice", async () => {
    const { serviceAccount } = await createTestPlanAndAccount(750);
     const testYear = testRunYear;
    const testMonth = 5;

    const first = await app.inject({
      method: "POST",
      url: "/billing/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { periodYear: testYear, periodMonth: testMonth },
    });
    expect(first.statusCode).toBe(201);
    const firstResult = first.json();
    expect(firstResult.createdCount).toBeGreaterThanOrEqual(1);

    const second = await app.inject({
      method: "POST",
      url: "/billing/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { periodYear: testYear, periodMonth: testMonth },
    });
    expect(second.statusCode).toBe(201);
    const secondResult = second.json();

    // the second run must skip everything that was already billed
    expect(secondResult.createdCount).toBe(0);
    expect(secondResult.skippedCount).toBeGreaterThanOrEqual(1);

    // confirm via direct query: exactly one invoice exists for this service account
    const invoicesRes = await app.inject({
      method: "GET",
      url: `/invoices?serviceAccountId=${serviceAccount.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    const invoicesForAccount = invoicesRes.json();
    expect(invoicesForAccount.length).toBe(1);
  });

  it("generates an invoice with the correct total matching the service account's locked rate", async () => {
    const { serviceAccount } = await createTestPlanAndAccount(1234.56);
    const testYear = testRunYear;
    const testMonth = 6;

    await app.inject({
      method: "POST",
      url: "/billing/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { periodYear: testYear, periodMonth: testMonth },
    });

    const invoicesRes = await app.inject({
      method: "GET",
      url: `/invoices?serviceAccountId=${serviceAccount.id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    const [invoice] = invoicesRes.json();

    expect(invoice.total).toBe("1234.56");
    expect(invoice.status).toBe("unpaid");
  });

  it("posts a matching ledger debit entry when an invoice is generated", async () => {
    const { subscriber, serviceAccount } = await createTestPlanAndAccount(888);
    const testYear = testRunYear;
    const testMonth = 7;

    await app.inject({
      method: "POST",
      url: "/billing/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { periodYear: testYear, periodMonth: testMonth },
    });

    const ledgerRes = await app.inject({
      method: "GET",
      url: `/subscribers/${subscriber.id}/ledger`,
      headers: { authorization: `Bearer ${token}` },
    });
    const entries = ledgerRes.json();

    expect(entries.length).toBe(1);
    expect(entries[0].debit).toBe("888.00");
    expect(entries[0].credit).toBe("0.00");
    expect(entries[0].balance).toBe("888.00");
  });
});