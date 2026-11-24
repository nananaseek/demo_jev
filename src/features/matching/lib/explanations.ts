import type { Specialist } from "@/features/specialists/types";

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "або",
  "без",
  "було",
  "для",
  "до",
  "з",
  "і",
  "й",
  "на",
  "не",
  "під",
  "після",
  "при",
  "та",
  "у",
  "що",
  "як",
]);

function wordStem(word: string): string {
  return word.slice(0, Math.max(4, Math.ceil(word.length * 0.7)));
}

export function tagMatches(complaint: string, tag: string): boolean {
  const text = normalizeText(complaint);
  const normalizedTag = normalizeText(tag);
  if (!normalizedTag) return false;
  if (text.includes(normalizedTag)) return true;

  return normalizedTag
    .split(" ")
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word))
    .some((word) => text.includes(wordStem(word)));
}

export function matchedTagsFor(complaint: string, tags: readonly string[]): string[] {
  return tags.filter((tag) => tagMatches(complaint, tag));
}

type RationaleSource = Pick<Specialist, "tags" | "approaches" | "languages">;

export function buildRationale(doctor: RationaleSource, matchedTags: readonly string[]): string {
  const topics = (matchedTags.length > 0 ? matchedTags : doctor.tags).slice(0, 3).join(", ");
  const approach = doctor.approaches[0] ?? "комплексний підхід";
  const languages = doctor.languages.join(", ");
  return `Збіг із запитом: ${topics}. Підхід: ${approach}. Мови: ${languages}.`;
}
