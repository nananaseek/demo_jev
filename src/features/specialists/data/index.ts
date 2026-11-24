import type { Specialist } from "../types";
import { categories, categoryById, subcategoryById } from "./categories";
import { specialists } from "./specialists.generated";

export { categories, categoryById, subcategoryById, specialists };

const bySubcategory = new Map<string, Specialist[]>();

for (const specialist of specialists) {
  const bucket = bySubcategory.get(specialist.subcategoryId);
  if (bucket) {
    bucket.push(specialist);
  } else {
    bySubcategory.set(specialist.subcategoryId, [specialist]);
  }
}

export function specialistsForSubcategory(subcategoryId: string): readonly Specialist[] {
  return bySubcategory.get(subcategoryId) ?? [];
}

export function specialistById(id: string): Specialist | undefined {
  return specialists.find((specialist) => specialist.id === id);
}
