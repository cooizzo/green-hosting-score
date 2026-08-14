import { afterEach, describe, expect, it, vi } from "vitest";
import { clearGreenCache } from "./greencheck";
import { liveScore } from "./live-scorer";

afterEach(() => {
  clearGreenCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("liveScore", () => {
  it("combines greencheck with Website Carbon and estimated bytes", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("greencheck")) {
        return {
          ok: true,
          json: async () => ({ green: true, url: "example.com", hosted_by: "Example Host" }),
        };
      }
      if (url.includes("websitecarbon.com/data")) {
        return {
          ok: true,
          json: async () => ({ gco2e: 0.12, rating: "B", cleanerThan: 0.8 }),
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const score = await liveScore("https://example.com/", "example.com", "fast");
    expect(score.mocked).toBe(false);
    expect(score.green).toBe(true);
    expect(score.gco2e).toBe(0.12);
    expect(score.rating).toBe("B");
    expect(score.cleanerThan).toBe(0.8);
    expect(score.gridLabel).toBeNull();
    expect(score.bytes).toBeGreaterThan(0);
    expect(score.fixes).toHaveLength(3);
  });
});
