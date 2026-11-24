import { z } from "zod";

export const ChoiceAnswerSchema = z.object({
  type: z.literal("choice"),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number()).optional(),
  confidence: z.number().optional(),
});

export const ScoreAnswerSchema = z.object({
  type: z.literal("score"),
  score: z.number(),
  legend: z.unknown().optional(),
  probabilities: z.record(z.string(), z.number()).optional(),
  confidence: z.number().optional(),
});

export const NoulAnswerSchema = z.object({
  type: z.literal("noul"),
  // OpenRouter Decisions returns the probability in `noul`; older examples use `probability`.
  noul: z.number().optional(),
  probability: z.number().optional(),
});

export const RefusalAnswerSchema = z.object({
  type: z.literal("refusal"),
});

export const DecisionAnswerSchema = z.discriminatedUnion("type", [
  ChoiceAnswerSchema,
  ScoreAnswerSchema,
  NoulAnswerSchema,
  RefusalAnswerSchema,
]);

export type ChoiceAnswer = z.infer<typeof ChoiceAnswerSchema>;
export type ScoreAnswer = z.infer<typeof ScoreAnswerSchema>;
export type NoulAnswer = z.infer<typeof NoulAnswerSchema>;
export type RefusalAnswer = z.infer<typeof RefusalAnswerSchema>;
export type DecisionAnswer = z.infer<typeof DecisionAnswerSchema>;

export const DecisionResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  answers: z.record(z.string(), DecisionAnswerSchema),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
      cost: z.number().optional(),
    })
    .optional(),
});

export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;

export interface DecisionQuestion {
  type: "choice" | "score" | "noul";
  instructions: string;
  criteria?: Record<string, string>;
}

export interface DecisionRequest {
  model?: string;
  state: unknown;
  questions: Record<string, DecisionQuestion>;
}
