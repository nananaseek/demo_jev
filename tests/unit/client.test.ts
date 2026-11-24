import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestDecisions } from "@/lib/jev/client";
import { JevError } from "@/lib/jev/errors";
import type { DecisionRequest } from "@/lib/jev/types";

const request: DecisionRequest = {
  state: { complaint: "Панічні атаки ввечері" },
  questions: {
    category: { type: "choice", instructions: "Обери категорію" },
  },
};

const okBody = {
  id: "dec_1",
  model: "typesafe/jev-1.14",
  provider: "TypeSafe",
  answers: {
    category: {
      type: "choice",
      choice: "mental-health",
      probabilities: { "mental-health": 0.9 },
      confidence: 0.9,
    },
  },
  usage: { input_tokens: 120, output_tokens: 0, cost: 0.000005 },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("requestDecisions", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends the bearer token and parses a valid decision", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestDecisions(request);
    expect(result.answers.category?.type).toBe("choice");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(init.cache).toBe("no-store");
  });

  it("does not retry authorization errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "bad key" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestDecisions(request)).rejects.toMatchObject({ code: "unauthorized" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries rate limits and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "slow down" }, 429))
      .mockResolvedValueOnce(jsonResponse(okBody));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestDecisions(request);
    expect(result.id).toBe("dec_1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails closed on an unexpected response shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ answers: [] })));

    await expect(requestDecisions(request)).rejects.toBeInstanceOf(JevError);
    await expect(requestDecisions(request)).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("fails when the key is missing without touching the network", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestDecisions(request)).rejects.toMatchObject({ code: "missing_key" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
