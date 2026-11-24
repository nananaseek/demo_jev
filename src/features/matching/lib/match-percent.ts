/**
 * Display-only conversion: JEV probabilities are spread across all candidate
 * profiles, so a low absolute probability can still be the clear leader.
 * The card percent expresses relative fit while `probability` stays honest.
 */
export function displayMatchPercent(probability: number, topProbability: number): number {
  if (!Number.isFinite(probability) || topProbability <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, probability / topProbability));
  return Math.round(55 + 42 * ratio);
}
