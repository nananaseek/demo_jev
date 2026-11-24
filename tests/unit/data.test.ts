import { describe, expect, it } from "vitest";

import { categories, specialists, specialistsForSubcategory } from "@/features/specialists/data";

describe("generated specialist data", () => {
  it("has 8 categories with 3 subcategories each", () => {
    expect(categories).toHaveLength(8);
    for (const category of categories) {
      expect(category.subcategories).toHaveLength(3);
      expect(category.tags.length).toBeGreaterThanOrEqual(5);
      expect(new Set(category.tags).size).toBe(category.tags.length);
      for (const tag of category.tags) expect(tag.length).toBeGreaterThan(2);
      for (const subcategory of category.subcategories) {
        expect(subcategory.categoryId).toBe(category.id);
        expect(subcategory.name.length).toBeGreaterThan(2);
        expect(subcategory.jevDescription.length).toBeGreaterThan(20);
      }
    }
  });

  it("has 5-8 unique specialists per subcategory", () => {
    const ids = new Set<string>();
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        const doctors = specialistsForSubcategory(subcategory.id);
        expect(doctors.length).toBeGreaterThanOrEqual(5);
        expect(doctors.length).toBeLessThanOrEqual(8);
        for (const doctor of doctors) {
          expect(doctor.categoryId).toBe(category.id);
          expect(doctor.subcategoryId).toBe(subcategory.id);
          expect(doctor.tags.length).toBeGreaterThan(0);
          expect(ids.has(doctor.id)).toBe(false);
          ids.add(doctor.id);
        }
      }
    }
    expect(specialists).toHaveLength(159);
    expect(ids.size).toBe(159);
  });

  it("uses clearly fictional contacts and future slots", () => {
    for (const doctor of specialists) {
      expect(doctor.name).not.toMatch(/@|https?:|тел\./i);
      expect(Number.isNaN(Date.parse(doctor.nextSlot))).toBe(false);
    }
  });
});
