import { afterEach, describe, expect, it, vi } from "vitest";
import { clearGreenCache } from "./greencheck";
import { clearGridCache } from "./grid-context";
import { liveScore } from "./live-scorer";

afterEach(() => {
  clearGreenCache();
  clearGridCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("liveScore", () => {
  it("measures page bytes then scores with greencheck, Website Carbon, and grid intensity", async () => {
    const html = "<html><body>hi</body></html>";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("greencheck")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ green: true, url: "example.com", hosted_by: "Example Host" }),
        };
      }
      if (url.includes("ip-to-co2intensity")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            country_name: "Norway",
            carbon_intensity: 30,
            generation_from_fossil: 2,
          }),
        };
      }
      if (url.includes("websitecarbon.com/data")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ gco2e: 0.12, rating: "B", cleanerThan: 0.8 }),
        };
      }
      if (url.startsWith("https://example.com")) {
        const encoded = new TextEncoder().encode(html);
        return {
          status: 200,
          headers: new Headers({ "content-length": String(encoded.byteLength) }),
          body: null,
          arrayBuffer: async () => encoded.buffer,
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const score = await liveScore("https://example.com/", "example.com", "fast", ["1.1.1.1"]);
    expect(score.mocked).toBe(false);
    expect(score.green).toBe(true);
    expect(score.gco2e).toBe(0.12);
    expect(score.rating).toBe("B");
    expect(score.cleanerThan).toBe(0.8);
    expect(score.gridLabel).toBe("clean · Norway");
    expect(score.gridIntensity).toBe(30);
    expect(score.bytes).toBe(html.length);
    expect(score.fixes.length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/data?bytes="))).toBe(true);
  });
});
