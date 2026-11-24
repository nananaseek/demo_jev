import { z } from "zod";

import { CATEGORY_IDS } from "../types";

const shortText = z.string().trim().min(2, "Мінімум 2 символи").max(120, "Максимум 120 символів");
const longText = z.string().trim().max(2000, "Максимум 2000 символів");
const list = z.array(z.string().trim().min(1)).min(1, "Додайте хоча б одне значення").max(20);

export const SpecialistSchema = z.object({
  id: z.string().min(1),
  categoryId: z.enum(CATEGORY_IDS),
  subcategoryId: z.string().min(1),
  name: shortText,
  role: shortText,
  experienceYears: z.number().int().min(0).max(70),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().min(0).max(100_000),
  priceUah: z.number().int().min(0).max(100_000),
  languages: list,
  approaches: list,
  tags: list,
  bio: longText,
  education: z.string().trim().max(500, "Максимум 500 символів"),
  nextSlot: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Некоректна дата"),
});

export type SpecialistInput = z.infer<typeof SpecialistSchema>;
