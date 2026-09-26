import type { FastifyInstance } from "fastify";
import { eq, and } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "../db/client.js";
import {
  billingCycles,
  invoices,
  invoiceItems,
  ledgerEntries,
  serviceAccounts,
  subscribers,
} from "../db/schema.js";
import { authenticate, requirePermission } from "../plugins/auth-guard.js";
import { generateBillingSchema } from "../validation/schemas.js";

function computeDueDate(periodYear: number, periodMonth: number, billingDay: number): string {
  // due date is the billing day in the billing period's month
  const month = String(periodMonth).padStart(2, "0");
  const day = String(billingDay).padStart(2, "0");
  return `${periodYear}-${month}-${day}`;
}

export async function billingRoutes(app: FastifyInstance) {
  app.post(
    "/billing/generate",
    { preHandler: [authenticate, requirePermission("billing.generate")] },
    async (request, reply) => {
      try {
        const input = generateBillingSchema.parse(request.body);
        const authUser = request.authUser!;

        const result = await db.transaction(async (tx) => {
          // find or create the billing cycle for this period
          let [cycle] = await tx
            .select()
            .from(billingCycles)
            .where(
              and(
                eq(billingCycles.periodYear, input.periodYear),
                eq(billingCycles.periodMonth, input.periodMonth)
              )
            );

          if (!cycle) {
            [cycle] = await tx
              .insert(billingCycles)
              .values({
                periodYear: input.periodYear,
                periodMonth: input.periodMonth,
                generatedByUserId: authUser.sub,
              })
              .returning();
          }

          // get all active service accounts
          const activeAccounts = await tx
            .select()
            .from(serviceAccounts)
            .where(eq(serviceAccounts.status, "active"));

          let createdCount = 0;
          let skippedCount = 0;

          for (const account of activeAccounts) {
            // check if an invoice already exists for this account + cycle
            const [existing] = await tx
              .select()
              .from(invoices)
              .where(
                and(
                  eq(invoices.serviceAccountId, account.id),
                  eq(invoices.billingCycleId, cycle.id)
                )
              );

            if (existing) {
              skippedCount++;
              continue;
            }

            const invoiceNumber = `INV-${input.periodYear}${String(input.periodMonth).padStart(2, "0")}-${account.id}`;
            const dueDate = computeDueDate(input.periodYear, input.periodMonth, account.billingDay);

            const [invoice] = await tx
              .insert(invoices)
              .values({
                invoiceNumber,
                serviceAccountId: account.id,
                billingCycleId: cycle.id,
                subscriptionCharge: account.currentRate,
                total: account.currentRate,
                status: "unpaid",
                dueDate,
              })
              .returning();

            await tx.insert(invoiceItems).values({
              invoiceId: invoice.id,
              description: "Monthly subscription charge",
              amount: account.currentRate,
            });

            await tx.insert(ledgerEntries).values({
              subscriberId: account.subscriberId,
              serviceAccountId: account.id,
              reference: invoiceNumber,
              description: `Billing for ${input.periodYear}-${String(input.periodMonth).padStart(2, "0")}`,
              debit: account.currentRate,
              credit: "0",
            });

            createdCount++;
          }

          return { cycleId: cycle.id, createdCount, skippedCount };
        });

        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof ZodError) {
          return reply.status(400).send({ error: "Validation failed", details: err.issues });
        }
        app.log.error(err);
        return reply.status(500).send({ error: "Could not generate billing" });
      }
    }
  );
}