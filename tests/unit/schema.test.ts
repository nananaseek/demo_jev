import { describe, expect, it } from "vitest";

import { MatchRequestSchema } from "@/features/matching/schemas/match";

describe("MatchRequestSchema", () => {
  it("accepts a valid category request", () => {
    const parsed = MatchRequestSchema.safeParse({
      step: "category",
      complaint: "Панічні атаки ввечері, важко дихати",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects too-short complaints", () => {
    const parsed = MatchRequestSchema.safeParse({ step: "category", complaint: "болить" });
    expect(parsed.success).toBe(false);
  });

  it("rejects unknown categories", () => {
    const parsed = MatchRequestSchema.safeParse({
      step: "subcategory",
      complaint: "Болить коліно після бігу",
      categoryId: "unknown",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires subcategoryId for the doctors step", () => {
    const parsed = MatchRequestSchema.safeParse({
      step: "doctors",
      complaint: "Болить коліно після бігу",
      categoryId: "orthopedics",
    });
    expect(parsed.success).toBe(false);
  });
});
