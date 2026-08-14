import { afterEach, describe, expect, it, vi } from "vitest";
import { UrlGuardError } from "./url-guard";
import { safeFetch } from "./safe-fetch";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonHeaders(init: Record<string, string> = {}) {
  return new Headers(init);
}

describe("safeFetch", () => {
  it("follows a same-host redirect and returns the final body", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://example.com/old") {
        return {
          status: 302,
          headers: jsonHeaders({ location: "/new" }),
          body: { cancel: async (): Promise<void> => undefined },
        };
      }
      if (url === "https://example.com/new") {
        const body = new TextEncoder().encode("hello");
        return {
          status: 200,
          headers: jsonHeaders({ "content-length": String(body.byteLength) }),
          body: null,
          arrayBuffer: async () => body.buffer,
        };
      }
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await safeFetch("https://example.com/old");
    expect(res.href).toBe("https://example.com/new");
    expect(res.body?.toString()).toBe("hello");
    expect(res.bytes).toBe(5);
  });

  it("rejects a redirect to a private IP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 302,
        headers: jsonHeaders({ location: "http://127.0.0.1/secret" }),
        body: { cancel: async (): Promise<void> => undefined },
      })),
    );

    await expect(safeFetch("https://example.com/ssrf")).rejects.toBeInstanceOf(UrlGuardError);
  });
});
