export const CATEGORY_IDS = [
  "mental-health",
  "cardiology",
  "neurology",
  "gastroenterology",
  "dermatology",
  "orthopedics",
  "pediatrics",
  "general-medicine",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Subcategory {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  jevDescription: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  jevDescription: string;
  tags: readonly string[];
  subcategories: Subcategory[];
}

export interface Specialist {
  id: string;
  categoryId: CategoryId;
  subcategoryId: string;
  name: string;
  role: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  priceUah: number;
  languages: string[];
  approaches: string[];
  tags: string[];
  bio: string;
  education: string;
  nextSlot: string;
}
