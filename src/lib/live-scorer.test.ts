import { afterEach, describe, expect, it, vi } from "vitest";
import { clearGreenCache } from "./greencheck";
import { liveScore } from "./live-scorer";

afterEach(() => {
  clearGreenCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("liveScore", () => {
  it("measures page bytes then scores with greencheck and Website Carbon", async () => {
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

    const score = await liveScore("https://example.com/", "example.com", "fast");
    expect(score.mocked).toBe(false);
    expect(score.green).toBe(true);
    expect(score.gco2e).toBe(0.12);
    expect(score.rating).toBe("B");
    expect(score.cleanerThan).toBe(0.8);
    expect(score.gridLabel).toBeNull();
    expect(score.bytes).toBe(html.length);
    expect(score.fixes.length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes("/data?bytes="))).toBe(true);
  });
});
