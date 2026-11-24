import type { MatchUsage } from "@/features/matching/types";
import { JevError } from "@/lib/jev/errors";
import type { ChoiceAnswer, DecisionResponse } from "@/lib/jev/types";

export function requireChoiceAnswer(response: DecisionResponse, key: string): ChoiceAnswer {
  const answer = response.answers[key];
  if (!answer) {
    throw new JevError("invalid_response", `JEV did not answer "${key}"`);
  }
  if (answer.type === "refusal") {
    throw new JevError("refusal", `JEV refused to answer "${key}"`);
  }
  if (answer.type !== "choice") {
    throw new JevError("invalid_response", `JEV answer "${key}" is not a choice`);
  }
  return answer;
}

export function readNoul(response: DecisionResponse, key: string): number | null {
  const answer = response.answers[key];
  if (!answer || answer.type !== "noul") return null;
  return answer.noul ?? answer.probability ?? null;
}

export function usageFrom(response: DecisionResponse): MatchUsage | undefined {
  if (!response.usage) return undefined;
  return {
    inputTokens: response.usage.input_tokens ?? 0,
    outputTokens: response.usage.output_tokens ?? 0,
    costUsd: response.usage.cost ?? 0,
  };
}

export function roundProbability(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
