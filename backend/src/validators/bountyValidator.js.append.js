const completedBountyQuerySchema = z.object({
  month: z.coerce
    .number()
    .min(1)
    .max(12)
    .transform(val => val.toString())
    .optional()
    .default(() => new Date().getMonth() + 1),
  year: z.coerce
    .number()
    .min(2020)
    .max(new Date().getFullYear())
    .transform(val => val.toString())
    .optional()
    .default(() => new Date().getFullYear())
});