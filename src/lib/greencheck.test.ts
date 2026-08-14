import { afterEach, describe, expect, it, vi } from "vitest";
import { checkGreen, checkGreenSafe, clearGreenCache } from "./greencheck";

afterEach(() => {
  clearGreenCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("checkGreen", () => {
  it("maps greencheck true and caches by hostname", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "example.com",
        green: true,
        hosted_by: "Example Host",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const a = await checkGreen("Example.COM");
    const b = await checkGreen("example.com");

    expect(a).toEqual({ green: true, hostname: "example.com", hostedBy: "Example Host" });
    expect(b).toEqual(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/greencheck/example.com");
  });

  it("maps a not-green response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ green: false, url: "example.com", data: false }),
      }),
    );

    const result = await checkGreen("example.com");
    expect(result.green).toBe(false);
    expect(result.hostedBy).toBeNull();
  });
});

describe("checkGreenSafe", () => {
  it("returns not-green when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await checkGreenSafe("example.com");
    expect(result).toEqual({ green: false, hostname: "example.com", hostedBy: null });
  });
});
