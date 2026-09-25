import type { FastifyInstance } from "fastify";
import { eq, ilike, or } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../db/client.js";
import { subscribers, subscriberAddresses } from "../db/schema.js";
import { authenticate, requirePermission } from "../plugins/auth-guard.js";
import { createSubscriberSchema, updateSubscriberSchema } from "../validation/schemas.js";

export async function subscriberRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { search?: string } }>(
    "/subscribers",
    { preHandler: [authenticate, requirePermission("subscriber.view")] },
    async (request) => {
      const { search } = request.query;
      if (search) {
        const term = `%${search}%`;
        return db
          .select()
          .from(subscribers)
          .where(
            or(
              ilike(subscribers.fullName, term),
              ilike(subscribers.accountNumber, term),
              ilike(subscribers.contactNumber, term)
            )
          );
      }
      return db.select().from(subscribers).orderBy(subscribers.fullName);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/subscribers/:id",
    { preHandler: [authenticate, requirePermission("subscriber.view")] },
    async (request, reply) => {
      const id = Number(request.params.id);

      const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.id, id));
      if (!subscriber) {
        return reply.status(404).send({ error: "Subscriber not found" });
      }

      const addresses = await db
        .select()
        .from(subscriberAddresses)
        .where(eq(subscriberAddresses.subscriberId, id));

      return { ...subscriber, addresses };
    }
  );

  app.post(
    "/subscribers",
    { preHandler: [authenticate, requirePermission("subscriber.manage")] },
    async (request, reply) => {
      try {
        const input = createSubscriberSchema.parse(request.body);

        const result = await db.transaction(async (tx) => {
          const [subscriber] = await tx
            .insert(subscribers)
            .values({
              accountNumber: input.accountNumber,
              fullName: input.fullName,
              contactNumber: input.contactNumber,
              email: input.email || undefined,
              notes: input.notes,
              collectionAreaId: input.collectionAreaId,
              assignedCollectorId: input.assignedCollectorId,
            })
            .returning();

          await tx.insert(subscriberAddresses).values({
            subscriberId: subscriber.id,
            addressLine: input.addressLine,
            isPrimary: true,
          });

          return subscriber;
        });

        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not create subscriber" });
      }
    }
  );

  app.patch<{ Params: { id: string } }>(
    "/subscribers/:id",
    { preHandler: [authenticate, requirePermission("subscriber.manage")] },
    async (request, reply) => {
      try {
        const input = updateSubscriberSchema.parse(request.body);
        const id = Number(request.params.id);

        const [subscriber] = await db
          .update(subscribers)
          .set(input)
          .where(eq(subscribers.id, id))
          .returning();

        if (!subscriber) {
          return reply.status(404).send({ error: "Subscriber not found" });
        }
        return subscriber;
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not update subscriber" });
      }
    }
  );
}