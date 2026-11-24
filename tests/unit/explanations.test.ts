import { describe, expect, it } from "vitest";

import { displayMatchPercent } from "@/features/matching/lib/match-percent";
import { buildRationale, matchedTagsFor, normalizeText, tagMatches } from "@/features/matching/lib/explanations";

describe("explanations", () => {
  it("normalizes Ukrainian punctuation and case", () => {
    expect(normalizeText("  Біль, у грудях!  ")).toBe("біль у грудях");
  });

  it("matches inflected profile tags against the complaint", () => {
    expect(tagMatches("Болить коліно після бігу, набряк", "Біль у коліні")).toBe(true);
    expect(tagMatches("Панічні атаки ввечері", "панічні атаки")).toBe(true);
    expect(tagMatches("Печія після їжі", "висип")).toBe(false);
  });

  it("returns only matched tags and explains the choice from them", () => {
    const tags = ["тривога", "панічні атаки", "сон"];
    const matched = matchedTagsFor("Панічні атаки ввечері", tags);
    expect(matched).toEqual(["панічні атаки"]);

    const rationale = buildRationale(
      { tags, approaches: ["КПТ"], languages: ["Українська"] },
      matched,
    );
    expect(rationale).toContain("панічні атаки");
    expect(rationale).toContain("КПТ");
  });

  it("maps the leader to a readable match score without inflating probability", () => {
    expect(displayMatchPercent(0.19, 0.19)).toBe(97);
    expect(displayMatchPercent(0.09, 0.19)).toBe(75);
    expect(displayMatchPercent(0, 0.19)).toBe(55);
  });
});
