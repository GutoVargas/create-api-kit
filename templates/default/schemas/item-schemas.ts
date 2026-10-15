import { z } from 'zod';

export const itemIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict();

export const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
}).strict();

export type ItemIdParams = z.infer<typeof itemIdSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
