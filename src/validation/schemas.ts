// ── Billing ──────────────────────────────────────────────
export const generateBillingSchema = z.object({
  periodYear: z.coerce.number().int().min(2020).max(2100),
  periodMonth: z.coerce.number().int().min(1).max(12),
});

export type GenerateBillingInput = z.infer<typeof generateBillingSchema>;