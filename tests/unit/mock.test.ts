import { describe, expect, it } from "vitest";

import type { CategoryId } from "@/features/specialists/types";
import { runMock } from "@/lib/jev/mock";

const FIXTURES = [
  ["Панічні атаки ввечері, важко дихати, триває два тижні", "mental-health", "psychotherapist"],
  ["Біль у грудях і задишка, тисне вже годину", "cardiology", "cardiologist"],
  ["Висип на руках, свербить, з'явився після крему", "dermatology", "dermatologist"],
  ["Болить коліно після бігу, набряк", "orthopedics", "orthopedist"],
  ["Дитина з температурою 38.5 та кашлем", "pediatrics", "pediatrician"],
  ["Печія після їжі, здуття живота", "gastroenterology", "gastroenterologist"],
] as const;

describe("runMock", () => {
  it.each(FIXTURES)("routes %s", (complaint, categoryId, subcategoryId) => {
    const category = runMock({ step: "category", complaint });
    expect(category.selected.id).toBe(categoryId);
    expect(category.mode).toBe("mock");

    const subcategory = runMock({
      step: "subcategory",
      complaint,
      categoryId: category.selected.id as CategoryId,
    });
    expect(subcategory.selected.id).toBe(subcategoryId);

    const doctors = runMock({
      step: "doctors",
      complaint,
      categoryId: category.selected.id as CategoryId,
      subcategoryId: subcategory.selected.id,
    });
    expect(doctors.doctors?.length).toBeGreaterThanOrEqual(5);
    expect(doctors.doctors?.[0]?.matchPercent).toBe(97);

    const probabilities = doctors.doctors?.map((doctor) => doctor.probability) ?? [];
    expect([...probabilities].sort((a, b) => b - a)).toEqual(probabilities);
  });

  it("flags emergency complaints and leaves panic without the banner", () => {
    expect(
      runMock({ step: "category", complaint: "Біль у грудях і задишка, тисне вже годину" }).safety
        .showEmergency,
    ).toBe(true);
    expect(
      runMock({
        step: "category",
        complaint: "Панічні атаки ввечері, важко дихати, триває два тижні",
      }).safety.showEmergency,
    ).toBe(false);
  });
});
