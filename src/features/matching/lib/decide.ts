import type { MatchCandidate, MatchDoctor, MatchResponse } from "@/features/matching/types";
import type { MatchRequest } from "@/features/matching/schemas/match";
import { buildRationale, matchedTagsFor } from "@/features/matching/lib/explanations";
import { displayMatchPercent } from "@/features/matching/lib/match-percent";
import { requireChoiceAnswer, readNoul, roundProbability, usageFrom } from "@/features/matching/lib/map-answers";
import { categories, categoryById, specialistsForSubcategory } from "@/features/specialists/data";
import type { CategoryId, Specialist } from "@/features/specialists/types";
import { requestDecisions } from "@/lib/jev/client";
import { jevConfig, resolveJevMode } from "@/lib/jev/config";
import { JevError } from "@/lib/jev/errors";
import { runMock } from "@/lib/jev/mock";
import { buildCategoryRequest, buildDoctorsRequest, buildSubcategoryRequest } from "@/lib/jev/questions";
import type { DecisionResponse } from "@/lib/jev/types";

function safetyFrom(response: DecisionResponse): MatchResponse["safety"] {
  const explicit = readNoul(response, "is_emergency");
  const emergencyProbability = explicit ?? 0;
  return {
    emergencyProbability: roundProbability(emergencyProbability),
    showEmergency: emergencyProbability >= jevConfig.emergencyThreshold,
  };
}

function sortCandidates(candidates: MatchCandidate[]): MatchCandidate[] {
  return [...candidates].sort((left, right) => right.probability - left.probability);
}

async function liveCategory(complaint: string, startedAt: number): Promise<MatchResponse> {
  const response = await requestDecisions(buildCategoryRequest(complaint));
  const choice = requireChoiceAnswer(response, "category");
  const selectedCategory = categoryById.get(choice.choice as CategoryId);
  if (!selectedCategory) {
    throw new JevError("invalid_response", "JEV chose an unknown category");
  }

  const probabilities = choice.probabilities ?? {};
  if (Object.keys(probabilities).length === 0) {
    throw new JevError("invalid_response", "JEV returned no probabilities");
  }

  const candidates = sortCandidates(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      probability: roundProbability(probabilities[category.id] ?? 0),
    })),
  );
  const confidence = choice.confidence ?? probabilities[choice.choice] ?? 0;
  const alternative = candidates.find((candidate) => candidate.id !== choice.choice)?.probability ?? 0;

  return {
    step: "category",
    mode: "live",
    model: response.model ?? jevConfig.model,
    latencyMs: Date.now() - startedAt,
    selected: {
      id: selectedCategory.id,
      name: selectedCategory.name,
      confidence: roundProbability(confidence),
      source: "jev",
    },
    candidates,
    needsClarification: confidence < jevConfig.categoryMinConfidence && alternative >= 0.08,
    safety: safetyFrom(response),
    usage: usageFrom(response),
  };
}

async function liveSubcategory(complaint: string, categoryId: string, startedAt: number): Promise<MatchResponse> {
  const category = categoryById.get(categoryId as CategoryId);
  if (!category) throw new JevError("invalid_request", "Unknown category");

  const response = await requestDecisions(buildSubcategoryRequest(complaint, category.id));
  const choice = requireChoiceAnswer(response, "subcategory");
  const selected = category.subcategories.find((subcategory) => subcategory.id === choice.choice);
  if (!selected) {
    throw new JevError("invalid_response", "JEV chose an unknown subcategory");
  }

  const probabilities = choice.probabilities ?? {};
  if (Object.keys(probabilities).length === 0) {
    throw new JevError("invalid_response", "JEV returned no probabilities");
  }

  const candidates = sortCandidates(
    category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description,
      probability: roundProbability(probabilities[subcategory.id] ?? 0),
    })),
  );
  const confidence = choice.confidence ?? probabilities[choice.choice] ?? 0;
  const alternative = candidates.find((candidate) => candidate.id !== choice.choice)?.probability ?? 0;

  return {
    step: "subcategory",
    mode: "live",
    model: response.model ?? jevConfig.model,
    latencyMs: Date.now() - startedAt,
    selected: {
      id: selected.id,
      name: selected.name,
      confidence: roundProbability(confidence),
      source: "jev",
    },
    candidates,
    needsClarification: confidence < jevConfig.subcategoryMinConfidence && alternative >= 0.08,
    safety: safetyFrom(response),
    usage: usageFrom(response),
  };
}

function toMatchDoctor(
  doctor: Specialist,
  complaint: string,
  probability: number,
  topProbability: number,
): MatchDoctor {
  const matchedTags = matchedTagsFor(complaint, doctor.tags).slice(0, 3);
  return {
    id: doctor.id,
    name: doctor.name,
    role: doctor.role,
    experienceYears: doctor.experienceYears,
    rating: doctor.rating,
    reviews: doctor.reviews,
    priceUah: doctor.priceUah,
    languages: doctor.languages,
    approaches: doctor.approaches,
    tags: doctor.tags,
    matchedTags,
    rationale: buildRationale(doctor, matchedTags),
    matchPercent: displayMatchPercent(probability, topProbability),
    probability,
    nextSlot: doctor.nextSlot,
    bio: doctor.bio,
    education: doctor.education,
  };
}

async function liveDoctors(
  complaint: string,
  categoryId: string,
  subcategoryId: string,
  startedAt: number,
): Promise<MatchResponse> {
  const category = categoryById.get(categoryId as CategoryId);
  if (!category) throw new JevError("invalid_request", "Unknown category");

  const response = await requestDecisions(buildDoctorsRequest(complaint, category.id, subcategoryId));
  const choice = requireChoiceAnswer(response, "doctor");
  const doctors = specialistsForSubcategory(subcategoryId);
  const selectedDoctor = doctors.find((doctor) => doctor.id === choice.choice);
  if (!selectedDoctor) {
    throw new JevError("invalid_response", "JEV chose an unknown specialist");
  }

  const probabilities = choice.probabilities ?? {};
  if (Object.keys(probabilities).length === 0) {
    throw new JevError("invalid_response", "JEV returned no probabilities");
  }

  const topProbability = Math.max(...Object.values(probabilities));
  const matchDoctors = [...doctors]
    .sort((left, right) => (probabilities[right.id] ?? 0) - (probabilities[left.id] ?? 0))
    .map((doctor) =>
      toMatchDoctor(doctor, complaint, roundProbability(probabilities[doctor.id] ?? 0), topProbability),
    );

  const top = matchDoctors[0];
  const candidates: MatchCandidate[] = matchDoctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    description: doctor.role,
    probability: doctor.probability,
  }));

  return {
    step: "doctors",
    mode: "live",
    model: response.model ?? jevConfig.model,
    latencyMs: Date.now() - startedAt,
    selected: {
      id: selectedDoctor.id,
      name: selectedDoctor.name,
      confidence: roundProbability(choice.confidence ?? probabilities[selectedDoctor.id] ?? 0),
      source: "jev",
    },
    candidates,
    needsClarification: false,
    doctors: matchDoctors,
    safety: safetyFrom(response),
    warning: top && top.probability < 0.15 ? "low_confidence" : undefined,
    usage: usageFrom(response),
  };
}

async function runLive(input: MatchRequest): Promise<MatchResponse> {
  const startedAt = Date.now();
  if (input.step === "category") return liveCategory(input.complaint, startedAt);
  if (input.step === "subcategory") {
    return liveSubcategory(input.complaint, input.categoryId, startedAt);
  }
  return liveDoctors(input.complaint, input.categoryId, input.subcategoryId, startedAt);
}

export async function decideMatch(input: MatchRequest): Promise<MatchResponse> {
  if (resolveJevMode() === "mock") return runMock(input);

  try {
    return await runLive(input);
  } catch (error) {
    if (error instanceof JevError && error.code === "refusal") {
      throw error;
    }
    const code = error instanceof JevError ? error.code : "unknown";
    const status = error instanceof JevError && error.status ? ` HTTP ${error.status}` : "";
    const message = error instanceof Error ? `: ${error.message}` : "";
    console.warn(`[jev] live decision failed (${code}${status})${message}; falling back to mock`);
    return { ...runMock(input), warning: "fallback_mock" };
  }
}
