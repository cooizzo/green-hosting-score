import { afterEach, describe, expect, it, vi } from "vitest";
import { measureFast } from "./measure-fast";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function res(status: number, body: string | null, headers: Record<string, string> = {}) {
  const encoded = new TextEncoder().encode(body ?? "");
  const h = new Headers(headers);
  if (body != null && !h.has("content-length")) h.set("content-length", String(encoded.byteLength));
  return {
    status,
    headers: h,
    body: body == null ? { cancel: async (): Promise<void> => undefined } : null,
    arrayBuffer: async () => encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength),
  };
}

describe("measureFast", () => {
  it("sums HTML and linked asset Content-Length values", async () => {
    const html = `
      <html>
        <head><link rel="stylesheet" href="/app.css"></head>
        <body><img src="/hero.jpg"><script src="/app.js"></script></body>
      </html>
    `;
    const css = `body{background:url('/bg.png')}`;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://example.com/" || url === "https://example.com") {
        return res(200, html);
      }
      if (url === "https://example.com/app.css") return res(200, css);
      if (url === "https://example.com/hero.jpg") return res(200, null, { "content-length": "5000" });
      if (url === "https://example.com/app.js") return res(200, null, { "content-length": "1200" });
      if (url === "https://example.com/bg.png") return res(200, null, { "content-length": "800" });
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const measured = await measureFast("https://example.com/");
    expect(measured.mode).toBe("fast");
    expect(measured.htmlBytes).toBe(html.length);
    expect(measured.bytes).toBe(html.length + css.length + 5000 + 1200 + 800);
    expect(measured.resourceCount).toBe(5);
  });

  it("skips assets that redirect to a private address", async () => {
    const html = `<html><body><img src="/evil.jpg"></body></html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith("https://example.com/") && !url.includes("evil")) return res(200, html);
        if (url === "https://example.com/evil.jpg") {
          return {
            status: 302,
            headers: new Headers({ location: "http://192.168.0.1/x" }),
            body: { cancel: async (): Promise<void> => undefined },
          };
        }
        throw new Error(`unexpected ${url}`);
      }),
    );

    const measured = await measureFast("https://example.com/");
    expect(measured.bytes).toBe(html.length);
    expect(measured.resourceCount).toBe(2);
  });
});
