import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { takeToken } from "@/lib/rate-limit";

describe("takeToken", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-24T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the limit and blocks the next request", () => {
    expect(takeToken("unit-a", 3).allowed).toBe(true);
    expect(takeToken("unit-a", 3).allowed).toBe(true);
    expect(takeToken("unit-a", 3).allowed).toBe(true);
    const blocked = takeToken("unit-a", 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("refills after the window", () => {
    expect(takeToken("unit-b", 1).allowed).toBe(true);
    expect(takeToken("unit-b", 1).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(takeToken("unit-b", 1).allowed).toBe(true);
  });
});
