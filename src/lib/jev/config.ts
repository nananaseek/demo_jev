const DEFAULT_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_MODEL = "~typesafe/jev-latest";

function readNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function readMode(value: string | undefined): "auto" | "live" | "mock" {
  return value === "live" || value === "mock" ? value : "auto";
}

export const jevConfig = {
  apiKey: process.env.OPENROUTER_API_KEY?.trim() ?? "",
  endpoint: process.env.JEV_DECISIONS_URL?.trim() || DEFAULT_ENDPOINT,
  model: process.env.JEV_MODEL?.trim() || DEFAULT_MODEL,
  mode: readMode(process.env.JEV_MODE),
  timeoutMs: readNumber(process.env.JEV_TIMEOUT_MS, 12_000, 1_000, 30_000),
  maxRetries: readNumber(process.env.JEV_MAX_RETRIES, 2, 0, 4),
  categoryMinConfidence: readNumber(process.env.JEV_CATEGORY_MIN_CONFIDENCE, 0.55, 0, 1),
  subcategoryMinConfidence: readNumber(process.env.JEV_SUBCATEGORY_MIN_CONFIDENCE, 0.5, 0, 1),
  emergencyThreshold: readNumber(process.env.JEV_EMERGENCY_THRESHOLD, 0.6, 0, 1),
  rateLimitPerMin: readNumber(process.env.JEV_RATE_LIMIT_PER_MIN, 30, 1, 1_000),
} as const;

export function resolveJevMode(): "live" | "mock" {
  if (jevConfig.mode === "mock") return "mock";
  if (!process.env.OPENROUTER_API_KEY?.trim()) return "mock";
  return "live";
}
