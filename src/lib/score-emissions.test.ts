import { afterEach, describe, expect, it, vi } from "vitest";
import { scoreEmissions } from "./score-emissions";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scoreEmissions", () => {
  it("uses Website Carbon /data when it succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bytes: 1_000_000,
        green: false,
        gco2e: 0.21,
        rating: "C",
        cleanerThan: 0.42,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const score = await scoreEmissions(1_000_000, false);
    expect(score).toEqual({
      gco2e: 0.21,
      rating: "C",
      cleanerThan: 0.42,
      source: "websitecarbon",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/data?bytes=1000000&green=0");
  });

  it("falls back to CO2.js when Website Carbon fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      }),
    );

    const score = await scoreEmissions(500_000, true);
    expect(score.source).toBe("co2js");
    expect(score.gco2e).toBeGreaterThan(0);
    expect(score.rating).toMatch(/^[A-F]\+?$/);
    expect(score.cleanerThan).toBeNull();
  });
});
