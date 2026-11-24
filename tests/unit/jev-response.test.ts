import { describe, expect, it } from "vitest";

import { readNoul } from "@/features/matching/lib/map-answers";
import { DecisionResponseSchema } from "@/lib/jev/types";

describe("JEV response schema", () => {
  it("accepts the noul field returned by the Decisions API", () => {
    const response = DecisionResponseSchema.parse({
      answers: { is_emergency: { type: "noul", noul: 0.82 } },
    });

    expect(readNoul(response, "is_emergency")).toBe(0.82);
  });

  it("still accepts the legacy probability field", () => {
    const response = DecisionResponseSchema.parse({
      answers: { is_emergency: { type: "noul", probability: 0.41 } },
    });

    expect(readNoul(response, "is_emergency")).toBe(0.41);
  });

  it("parses a choice answer with probabilities and confidence", () => {
    const response = DecisionResponseSchema.parse({
      model: "typesafe/jev-1.14-20261014",
      provider: "TypeSafe",
      answers: {
        category: {
          type: "choice",
          choice: "mental-health",
          probabilities: { "mental-health": 0.99, cardiology: 0.01 },
          confidence: 0.99,
        },
      },
      usage: { input_tokens: 100, output_tokens: 10, cost: 0.0001 },
    });

    const answer = response.answers.category;
    expect(answer.type).toBe("choice");
    if (answer.type === "choice") expect(answer.choice).toBe("mental-health");
  });
});
