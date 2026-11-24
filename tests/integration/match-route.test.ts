import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/match/route";

let ipCounter = 0;

function request(body: unknown) {
  ipCounter += 1;
  return new Request("http://localhost/api/match", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/match", () => {
  it("returns a mock category decision with no-store", async () => {
    const response = await POST(
      request({ step: "category", complaint: "Панічні атаки ввечері, важко дихати" }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(data.mode).toBe("mock");
    expect(data.selected.id).toBe("mental-health");
    expect(data.candidates.length).toBe(8);
  });

  it("returns ranked doctors for a subcategory", async () => {
    const response = await POST(
      request({
        step: "doctors",
        complaint: "Панічні атаки ввечері, важко дихати",
        categoryId: "mental-health",
        subcategoryId: "psychotherapist",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.doctors.length).toBeGreaterThanOrEqual(5);
    expect(data.doctors[0].matchPercent).toBe(97);
  });

  it("rejects invalid complaints", async () => {
    const response = await POST(request({ step: "category", complaint: "болить" }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("bad_request");
  });

  it("rejects a subcategory from another category", async () => {
    const response = await POST(
      request({
        step: "doctors",
        complaint: "Болить коліно після бігу, набряк",
        categoryId: "orthopedics",
        subcategoryId: "psychotherapist",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rate limits a single client after 30 requests per minute", async () => {
    const ip = "10.9.9.9";
    const body = { step: "category", complaint: "Панічні атаки ввечері, важко дихати" };
    let lastStatus = 0;
    for (let index = 0; index < 31; index += 1) {
      const response = await POST(
        new Request("http://localhost/api/match", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify(body),
        }),
      );
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });
});
