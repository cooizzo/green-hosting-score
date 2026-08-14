import { describe, expect, it } from "vitest";
import { normalizeRating, ratingFromGco2e } from "./rating";

describe("ratingFromGco2e", () => {
  it("maps SWDM v4 Digital Carbon Rating ceilings", () => {
    expect(ratingFromGco2e(0.04)).toBe("A+");
    expect(ratingFromGco2e(0.079)).toBe("A");
    expect(ratingFromGco2e(0.145)).toBe("B");
    expect(ratingFromGco2e(0.209)).toBe("C");
    expect(ratingFromGco2e(0.278)).toBe("D");
    expect(ratingFromGco2e(0.359)).toBe("E");
    expect(ratingFromGco2e(0.36)).toBe("F");
  });
});

describe("normalizeRating", () => {
  it("keeps a valid letter and falls back from gCO2e otherwise", () => {
    expect(normalizeRating("A+", 9)).toBe("A+");
    expect(normalizeRating("nope", 0.04)).toBe("A+");
  });
});
