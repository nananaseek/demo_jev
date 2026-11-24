import { z } from "zod";
import { CATEGORY_IDS } from "@/features/specialists/types";

const complaintSchema = z
  .string()
  .trim()
  .min(12, "Опишіть скаргу хоча б 12 символами")
  .max(1000, "Скарга має бути не довшою за 1000 символів");

export const MatchRequestSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("category"),
    complaint: complaintSchema,
  }),
  z.object({
    step: z.literal("subcategory"),
    complaint: complaintSchema,
    categoryId: z.enum(CATEGORY_IDS),
  }),
  z.object({
    step: z.literal("doctors"),
    complaint: complaintSchema,
    categoryId: z.enum(CATEGORY_IDS),
    subcategoryId: z.string().trim().min(1).max(64),
  }),
]);

export type MatchRequest = z.infer<typeof MatchRequestSchema>;
