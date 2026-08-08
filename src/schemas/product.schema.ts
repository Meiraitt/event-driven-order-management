import { z } from "zod";

export const createProductBodySchema = z.object({
  name: z.string().min(1),
  price: z.string(),
  stock: z.number().int().nonnegative(),
});

export type CreateProductInput = z.infer<typeof createProductBodySchema>;
