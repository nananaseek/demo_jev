import type { CategoryId } from "@/features/specialists/types";

export type MatchStep = "category" | "subcategory" | "doctors";
export type MatchMode = "live" | "mock";
export type MatchWarning = "fallback_mock" | "low_confidence";
export type MatchSource = "jev" | "user" | "mock";

export interface MatchCandidate {
  id: string;
  name: string;
  description: string;
  probability: number;
}

export interface MatchDoctor {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  rating: number;
  reviews: number;
  priceUah: number;
  languages: string[];
  approaches: string[];
  tags: string[];
  matchedTags: string[];
  rationale: string;
  matchPercent: number;
  probability: number;
  nextSlot: string;
  bio: string;
  education: string;
}

export interface MatchSelected {
  id: string;
  name: string;
  confidence: number;
  source: MatchSource;
}

export interface MatchSafety {
  emergencyProbability: number;
  showEmergency: boolean;
}

export interface MatchUsage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface MatchResponse {
  step: MatchStep;
  mode: MatchMode;
  model: string;
  latencyMs: number;
  selected: MatchSelected;
  candidates: MatchCandidate[];
  needsClarification: boolean;
  doctors?: MatchDoctor[];
  safety: MatchSafety;
  warning?: MatchWarning;
  usage?: MatchUsage;
}

export interface ResolvedCategory {
  categoryId: CategoryId;
  subcategoryId: string;
}
