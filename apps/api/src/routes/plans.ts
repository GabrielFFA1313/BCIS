import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../db/client.js";
import { servicePlans } from "../db/schema.js";
import { authenticate, requirePermission } from "../plugins/auth-guard.js";
import { createPlanSchema, updatePlanSchema } from "../validation/schemas.js";

export async function planRoutes(app: FastifyInstance) {
  app.get(
    "/plans",
    { preHandler: [authenticate, requirePermission("subscriber.view")] },
    async () => {
      return db.select().from(servicePlans).orderBy(servicePlans.name);
    }
  );

  app.post(
    "/plans",
    { preHandler: [authenticate, requirePermission("subscriber.manage")] },
    async (request, reply) => {
      try {
        const input = createPlanSchema.parse(request.body);
        const [plan] = await db
          .insert(servicePlans)
          .values({
            code: input.code,
            name: input.name,
            type: input.type,
            price: input.price.toFixed(2),
            installationFee: input.installationFee?.toFixed(2) ?? "0",
            speedMbps: input.speedMbps,
            channelCount: input.channelCount,
            description: input.description,
          })
          .returning();
        return reply.status(201).send(plan);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not create plan" });
      }
    }
  );

  app.patch<{ Params: { id: string } }>(
    "/plans/:id",
    { preHandler: [authenticate, requirePermission("subscriber.manage")] },
    async (request, reply) => {
      try {
        const input = updatePlanSchema.parse(request.body);
        const id = Number(request.params.id);

        const updateValues: Record<string, unknown> = { ...input };
        if (input.price !== undefined) updateValues.price = input.price.toFixed(2);
        if (input.installationFee !== undefined)
          updateValues.installationFee = input.installationFee.toFixed(2);

        const [plan] = await db
          .update(servicePlans)
          .set(updateValues)
          .where(eq(servicePlans.id, id))
          .returning();

        if (!plan) {
          return reply.status(404).send({ error: "Plan not found" });
        }
        return plan;
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not update plan" });
      }
    }
  );
}