import { categories, categoryById, specialistsForSubcategory } from "@/features/specialists/data";
import type { Category, CategoryId, Specialist } from "@/features/specialists/types";
import type { MatchCandidate, MatchDoctor, MatchResponse } from "@/features/matching/types";
import type { MatchRequest } from "@/features/matching/schemas/match";
import { buildRationale, matchedTagsFor, normalizeText, tagMatches } from "@/features/matching/lib/explanations";
import { displayMatchPercent } from "@/features/matching/lib/match-percent";
import { jevConfig } from "@/lib/jev/config";

const SUBCATEGORY_HINTS: Record<string, readonly string[]> = {
  psychologist: ["стрес", "тривог", "стосунк", "самооцін", "вигор", "адаптац", "втрат", "кар'єр", "сон", "паніч"],
  psychotherapist: ["паніч", "атак", "тривог", "депрес", "травм", "нав'язлив", "розлад харчуван", "сором", "дитяч", "терап", "кпт"],
  psychiatrist: ["депрес", "біполяр", "психоз", "галюцин", "безсонн", "суїцид", "окр", "медикамент"],
  cardiologist: ["серц", "груд", "тиск", "задишк", "набряк", "холестерин", "шум"],
  arrhythmologist: ["перебо", "тахікард", "ритм", "фібриляц", "запамороч", "холтер"],
  cardiosurgeon: ["вад", "коронар", "аневризм", "стентуван", "операц", "вроджен"],
  neurologist: ["голов", "мігрен", "невралг", "онімін", "тремор", "пам'ят", "запамороч"],
  epileptologist: ["судом", "епілепс", "напад", "свідомост", "еег"],
  neurosurgeon: ["гриж", "пухлин", "аневризм", "травм хребт", "травм мозк", "операц"],
  gastroenterologist: ["печі", "гастрит", "виразк", "здутт", "діаре", "закреп", "кишк", "нудот"],
  hepatologist: ["печінк", "гепатит", "жовтян", "цироз", "фермент"],
  dietitian: ["харчуван", "ваг", "діабет", "алерг", "вітамін", "дієт"],
  dermatologist: ["висип", "сверб", "дерматит", "екзем", "псоріаз", "акне", "грибк", "шкір"],
  dermatooncologist: ["родимк", "меланом", "новоутвор", "дерматоскоп", "рак шкір"],
  trichologist: ["волос", "алопеці", "луп", "себоре", "шкір голови"],
  orthopedist: ["колін", "перелом", "розтягн", "суглоб", "артроз", "плоскостоп", "травм"],
  vertebrologist: ["спин", "гриж", "протруз", "сколіоз", "остеохондроз", "шиї"],
  rehabilitologist: ["реабілітац", "лфк", "м'яз", "після операц", "відновлен", "постав"],
  pediatrician: ["дитин", "дитяч", "немовл", "малюк", "температур", "кашел", "нежит", "щеплен", "розвитк"],
  "pediatric-neurologist": ["дитин", "затримк розвитк", "судом", "тик", "головн біль", "уваг", "сон"],
  "pediatric-allergist": ["алерг", "атопічн", "кропив", "астм", "дерматит"],
  therapist: ["втом", "застуд", "тиск", "аналіз", "слабк", "кашел"],
  "family-doctor": ["профілакт", "вакцин", "хронічн", "перший контакт", "сім'ї", "родин"],
  geriatrician: ["падінн", "пам'ят", "лік", "крихк", "65", "похил", "стар"],
};

const CATEGORY_HINTS: Record<CategoryId, readonly string[]> = {
  "mental-health": ["тривог", "паніч", "депрес", "стрес", "псих", "емоц", "настрій", "апаті", "вигор"],
  cardiology: ["серц", "груд", "тиск", "задишк", "ритм", "тахікард", "перебо"],
  neurology: ["голов", "мігрен", "нерв", "онімін", "запамороч", "судом", "тремор", "пам'ят"],
  gastroenterology: ["живот", "шлун", "печі", "нудот", "кишк", "печінк", "жовт", "здутт", "діаре", "закреп"],
  dermatology: ["шкір", "висип", "сверб", "родимк", "акне", "волос", "нігт", "псоріаз"],
  orthopedics: ["колін", "спин", "суглоб", "перелом", "травм", "м'яз", "хребет", "плеч", "кульш"],
  pediatrics: ["дитин", "дитяч", "немовл", "малюк", "температур", "щеплен", "розвитк"],
  "general-medicine": ["втом", "слабк", "температур", "кашел", "застуд", "тиск", "аналіз", "профілакт"],
};

const EMERGENCY_KEYWORDS = [
  "біль у грудях із задишк",
  "не можу дихати",
  "біль у грудях",
  "втрата свідомост",
  "непритомн",
  "інсульт",
  "кровотеч",
  "суїцид",
  "не дихає",
  "оніміння обличч",
  "порушення мовлення",
];

function roundProbability(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function noise01(seed: string): number {
  return fnv1a(seed) / 0xffffffff;
}

function scoreKeywords(text: string, keywords: readonly string[]): number {
  let score = 0;
  for (const keyword of keywords) {
    const normalized = normalizeText(keyword);
    if (normalized && text.includes(normalized)) {
      score += 1 + Math.min(normalized.length, 12) / 10;
    }
  }
  return score;
}

function softmax(scores: Record<string, number>, temperature: number): Record<string, number> {
  const entries = Object.entries(scores);
  if (entries.length === 0) return {};
  const max = Math.max(...entries.map(([, value]) => value));
  const weighted = entries.map(([key, value]) => [key, Math.exp((value - max) / temperature)] as const);
  const sum = weighted.reduce((total, [, value]) => total + value, 0);
  return Object.fromEntries(weighted.map(([key, value]) => [key, roundProbability(value / sum)]));
}

export function estimateEmergencyProbability(complaint: string): number {
  const text = normalizeText(complaint);
  const hit = EMERGENCY_KEYWORDS.some((keyword) => text.includes(normalizeText(keyword)));
  return roundProbability(hit ? 0.82 : 0.04 + noise01(`emergency:${complaint}`) * 0.06);
}

function safetyFor(complaint: string): MatchResponse["safety"] {
  const emergencyProbability = estimateEmergencyProbability(complaint);
  return {
    emergencyProbability,
    showEmergency: emergencyProbability >= jevConfig.emergencyThreshold,
  };
}

function sortedCandidates(
  entries: readonly { id: string; name: string; description: string }[],
  probabilities: Record<string, number>,
): MatchCandidate[] {
  return entries
    .map((entry) => ({
      ...entry,
      probability: probabilities[entry.id] ?? 0,
    }))
    .sort((left, right) => right.probability - left.probability);
}

function scoreCategory(complaint: string, text: string, category: Category): number {
  const subScores = category.subcategories.map((subcategory) =>
    scoreKeywords(text, SUBCATEGORY_HINTS[subcategory.id] ?? []),
  );
  const bestSub = subScores.length > 0 ? Math.max(...subScores) : 0;
  const totalSub = subScores.reduce((total, value) => total + value, 0);
  const hint = scoreKeywords(text, CATEGORY_HINTS[category.id]);
  return bestSub + (totalSub - bestSub) * 0.2 + hint * 0.9 + noise01(`${complaint}:${category.id}`) * 0.25;
}

export function runMock(input: MatchRequest): MatchResponse {
  const startedAt = Date.now();
  if (input.step === "category") return mockCategory(input.complaint, startedAt);
  if (input.step === "subcategory") return mockSubcategory(input.complaint, input.categoryId, startedAt);
  return mockDoctors(input.complaint, input.subcategoryId, startedAt);
}

export function mockCategory(complaint: string, startedAt = Date.now()): MatchResponse {
  const text = normalizeText(complaint);
  const scores = Object.fromEntries(
    categories.map((category) => [category.id, scoreCategory(complaint, text, category)]),
  );
  const probabilities = softmax(scores, 1.1);
  const candidates = sortedCandidates(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
    })),
    probabilities,
  );
  const top = candidates[0];

  return {
    step: "category",
    mode: "mock",
    model: "mock-jev",
    latencyMs: Date.now() - startedAt,
    selected: { id: top.id, name: top.name, confidence: top.probability, source: "mock" },
    candidates,
    needsClarification:
      top.probability < jevConfig.categoryMinConfidence && (candidates[1]?.probability ?? 0) >= 0.08,
    safety: safetyFor(complaint),
    usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  };
}

export function mockSubcategory(complaint: string, categoryId: CategoryId, startedAt = Date.now()): MatchResponse {
  const category = categoryById.get(categoryId);
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  const text = normalizeText(complaint);
  const scores = Object.fromEntries(
    category.subcategories.map((subcategory) => [
      subcategory.id,
      scoreKeywords(text, SUBCATEGORY_HINTS[subcategory.id] ?? []) +
        noise01(`${complaint}:${subcategory.id}`) * 0.2,
    ]),
  );
  const probabilities = softmax(scores, 1.1);
  const candidates = sortedCandidates(
    category.subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      description: subcategory.description,
    })),
    probabilities,
  );
  const top = candidates[0];

  return {
    step: "subcategory",
    mode: "mock",
    model: "mock-jev",
    latencyMs: Date.now() - startedAt,
    selected: { id: top.id, name: top.name, confidence: top.probability, source: "mock" },
    candidates,
    needsClarification:
      top.probability < jevConfig.subcategoryMinConfidence && (candidates[1]?.probability ?? 0) >= 0.08,
    safety: safetyFor(complaint),
    usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  };
}

export function mockDoctors(complaint: string, subcategoryId: string, startedAt = Date.now()): MatchResponse {
  const doctors = specialistsForSubcategory(subcategoryId);
  if (doctors.length === 0) throw new Error(`No specialists for ${subcategoryId}`);

  const scores: Record<string, number> = {};
  for (const doctor of doctors) {
    const tagHits = doctor.tags.filter((tag) => tagMatches(complaint, tag)).length;
    const approachHits = doctor.approaches.filter((approach) => tagMatches(complaint, approach)).length;
    scores[doctor.id] =
      tagHits * 2.2 +
      approachHits * 0.8 +
      (doctor.rating - 4.5) * 0.9 +
      doctor.experienceYears / 150 +
      noise01(`${complaint}:${doctor.id}`) * 0.35;
  }

  const probabilities = softmax(scores, 0.5);
  const topProbability = Math.max(...Object.values(probabilities));
  const ranked = [...doctors].sort((left, right) => (probabilities[right.id] ?? 0) - (probabilities[left.id] ?? 0));

  const matchDoctors: MatchDoctor[] = ranked.map((doctor) => {
    const matchedTags = matchedTagsFor(complaint, doctor.tags).slice(0, 3);
    const probability = probabilities[doctor.id] ?? 0;
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
  });

  const top = matchDoctors[0];
  const candidates: MatchCandidate[] = matchDoctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    description: doctor.role,
    probability: doctor.probability,
  }));

  return {
    step: "doctors",
    mode: "mock",
    model: "mock-jev",
    latencyMs: Date.now() - startedAt,
    selected: { id: top.id, name: top.name, confidence: top.probability, source: "mock" },
    candidates,
    needsClarification: false,
    doctors: matchDoctors,
    safety: safetyFor(complaint),
    warning: top.probability < 0.15 ? "low_confidence" : undefined,
    usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  };
}

export function mockDoctorById(doctorId: string): Specialist | undefined {
  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      const doctor = specialistsForSubcategory(subcategory.id).find((item) => item.id === doctorId);
      if (doctor) return doctor;
    }
  }
  return undefined;
}
