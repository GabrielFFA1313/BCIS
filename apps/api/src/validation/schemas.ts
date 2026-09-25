import { z } from "zod";

// ── Service Plans ──────────────────────────────────────
export const createPlanSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(150),
  type: z.enum(["internet", "cable", "combo"]),
  price: z.coerce.number().positive(),
  installationFee: z.coerce.number().nonnegative().optional().default(0),
  speedMbps: z.coerce.number().int().positive().optional(),
  channelCount: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Subscribers ─────────────────────────────────────────
export const createSubscriberSchema = z.object({
  accountNumber: z.string().min(1).max(30),
  fullName: z.string().min(1).max(200),
  contactNumber: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  collectionAreaId: z.coerce.number().int().positive().optional(),
  assignedCollectorId: z.coerce.number().int().positive().optional(),
  addressLine: z.string().min(1), // first address, created alongside the subscriber
});

export const updateSubscriberSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  contactNumber: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "terminated", "archived"]).optional(),
  notes: z.string().optional(),
  collectionAreaId: z.coerce.number().int().positive().optional(),
  assignedCollectorId: z.coerce.number().int().positive().optional(),
});

// ── Service Accounts ─────────────────────────────────────
export const createServiceAccountSchema = z.object({
  serviceAccountNumber: z.string().min(1).max(30),
  planId: z.coerce.number().int().positive(),
  installationAddress: z.string().min(1),
  activationDate: z.string().optional(), // ISO date string, e.g. "2026-09-25"
  billingStartDate: z.string().optional(),
  billingDay: z.coerce.number().int().min(1).max(28).optional().default(1),
  collectionAreaId: z.coerce.number().int().positive().optional(),
  collectorId: z.coerce.number().int().positive().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>;
export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>;
export type CreateServiceAccountInput = z.infer<typeof createServiceAccountSchema>;