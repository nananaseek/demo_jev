import { jevConfig, resolveJevMode } from "@/lib/jev/config";
import { JevError, isRetryableStatus } from "@/lib/jev/errors";
import { DecisionResponseSchema, type DecisionRequest, type DecisionResponse } from "@/lib/jev/types";

const RETRY_BASE_MS = 1_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function authorization(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new JevError("missing_key", "OPENROUTER_API_KEY is not configured");
  }
  return `Bearer ${key}`;
}

function errorCodeForStatus(status: number): "unauthorized" | "invalid_request" | "rate_limited" | "upstream" {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 422) return "invalid_request";
  if (status === 429) return "rate_limited";
  return "upstream";
}

async function postOnce(body: DecisionRequest, signal: AbortSignal): Promise<DecisionResponse> {
  const response = await fetch(jevConfig.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      "X-Title": "JEV Match demo",
    },
    body: JSON.stringify({
      model: body.model ?? jevConfig.model,
      state: body.state,
      questions: body.questions,
    }),
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new JevError(errorCodeForStatus(response.status), `JEV request failed with ${response.status}`, response.status);
  }

  const json: unknown = await response.json().catch(() => {
    throw new JevError("invalid_response", "JEV returned a non-JSON response");
  });
  const parsed = DecisionResponseSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
      .join("; ");
    throw new JevError("invalid_response", `JEV response does not match the expected schema (${issues})`);
  }
  return parsed.data;
}

async function postWithTimeout(body: DecisionRequest): Promise<DecisionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), jevConfig.timeoutMs);
  try {
    return await postOnce(body, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new JevError("timeout", `JEV request timed out after ${jevConfig.timeoutMs}ms`);
    }
    if (error instanceof JevError) throw error;
    throw new JevError("network", error instanceof Error ? error.message : "Network error");
  } finally {
    clearTimeout(timer);
  }
}

function shouldRetry(error: JevError): boolean {
  if (error.code === "timeout" || error.code === "network" || error.code === "rate_limited") return true;
  return error.status !== undefined && isRetryableStatus(error.status);
}

export async function requestDecisions(body: DecisionRequest): Promise<DecisionResponse> {
  if (resolveJevMode() === "mock") {
    throw new JevError("missing_key", "JEV is running in mock mode");
  }

  let lastError: JevError | null = null;
  for (let attempt = 0; attempt <= jevConfig.maxRetries; attempt += 1) {
    try {
      return await postWithTimeout(body);
    } catch (error) {
      const jevError = error instanceof JevError ? error : new JevError("network", "Network error");
      lastError = jevError;
      if (!shouldRetry(jevError) || attempt === jevConfig.maxRetries) throw jevError;
      const delay = RETRY_BASE_MS * 2 ** attempt + Math.floor(Math.random() * 250);
      await sleep(delay);
    }
  }

  throw lastError ?? new JevError("upstream", "JEV request failed");
}
