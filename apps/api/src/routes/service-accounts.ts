import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../db/client.js";
import {
  serviceAccounts,
  serviceAccountStatusHistory,
  servicePlans,
  subscribers,
} from "../db/schema.js";
import { authenticate, requirePermission } from "../plugins/auth-guard.js";
import { createServiceAccountSchema } from "../validation/schemas.js";

export async function serviceAccountRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/service-accounts/:id",
    { preHandler: [authenticate, requirePermission("subscriber.view")] },
    async (request, reply) => {
      const id = Number(request.params.id);
      const [account] = await db
        .select()
        .from(serviceAccounts)
        .where(eq(serviceAccounts.id, id));

      if (!account) {
        return reply.status(404).send({ error: "Service account not found" });
      }
      return account;
    }
  );

  app.post<{ Params: { subscriberId: string } }>(
    "/subscribers/:subscriberId/service-accounts",
    { preHandler: [authenticate, requirePermission("subscriber.manage")] },
    async (request, reply) => {
      try {
        const subscriberId = Number(request.params.subscriberId);
        const input = createServiceAccountSchema.parse(request.body);
        const authUser = request.authUser!;

        const result = await db.transaction(async (tx) => {
          // confirm subscriber exists
          const [subscriber] = await tx
            .select()
            .from(subscribers)
            .where(eq(subscribers.id, subscriberId));
          if (!subscriber) {
            throw new Error("SUBSCRIBER_NOT_FOUND");
          }

          // fetch the plan to copy its CURRENT price - this preserves
          // the billed rate even if the plan's price changes later
          const [plan] = await tx
            .select()
            .from(servicePlans)
            .where(eq(servicePlans.id, input.planId));
          if (!plan || !plan.isActive) {
            throw new Error("PLAN_NOT_FOUND_OR_INACTIVE");
          }

          const [account] = await tx
            .insert(serviceAccounts)
            .values({
              serviceAccountNumber: input.serviceAccountNumber,
              subscriberId,
              planId: input.planId,
              installationAddress: input.installationAddress,
              activationDate: input.activationDate,
              billingStartDate: input.billingStartDate,
              billingDay: input.billingDay,
              currentRate: plan.price, // copied at creation time, not referenced live
              collectionAreaId: input.collectionAreaId,
              collectorId: input.collectorId,
            })
            .returning();

          // record the initial status in history too, for a complete audit trail
          await tx.insert(serviceAccountStatusHistory).values({
            serviceAccountId: account.id,
            status: "active",
            reason: "Service account created",
            changedByUserId: authUser.sub,
          });

          return account;
        });

        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        if (err instanceof Error && err.message === "SUBSCRIBER_NOT_FOUND") {
          return reply.status(404).send({ error: "Subscriber not found" });
        }
        if (err instanceof Error && err.message === "PLAN_NOT_FOUND_OR_INACTIVE") {
          return reply.status(400).send({ error: "Plan not found or inactive" });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not create service account" });
      }
    }
  );

  app.get<{ Params: { subscriberId: string } }>(
    "/subscribers/:subscriberId/service-accounts",
    { preHandler: [authenticate, requirePermission("subscriber.view")] },
    async (request) => {
      const subscriberId = Number(request.params.subscriberId);
      return db
        .select()
        .from(serviceAccounts)
        .where(eq(serviceAccounts.subscriberId, subscriberId));
    }
  );
}