import { z } from "zod";

export const createOrderBodySchema = z.object({
  email: z.string().email(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});
