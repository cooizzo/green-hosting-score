import { describe, expect, it } from "vitest";
import { hostnameToSlugBase, makeResultSlug } from "./slug";
import { mockScore } from "./mock-scorer";
import { UrlGuardError, guardUrl } from "./url-guard";

describe("hostnameToSlugBase", () => {
  it("slugifies hostnames", () => {
    expect(hostnameToSlugBase("www.Example.COM")).toBe("www-example-com");
  });
});

describe("makeResultSlug", () => {
  it("includes hostname base and unique suffix", () => {
    const slug = makeResultSlug("example.com");
    expect(slug.startsWith("example-com-")).toBe(true);
    expect(slug.length).toBeGreaterThan("example-com-".length);
  });
});

describe("mockScore", () => {
  it("returns deterministic mocked metrics", () => {
    const a = mockScore("https://example.com", "fast");
    const b = mockScore("https://example.com", "fast");
    expect(a.bytes).toBe(b.bytes);
    expect(a.mocked).toBe(true);
    expect(a.fixes).toHaveLength(3);
    expect(a.rating).toMatch(/^[A-F]\+?$/);
  });
});

describe("guardUrl", () => {
  it("rejects non-http protocols", async () => {
    await expect(guardUrl("ftp://example.com")).rejects.toBeInstanceOf(UrlGuardError);
  });

  it("rejects localhost", async () => {
    await expect(guardUrl("http://localhost/")).rejects.toBeInstanceOf(UrlGuardError);
  });

  it("rejects private IPs", async () => {
    await expect(guardUrl("http://127.0.0.1/")).rejects.toBeInstanceOf(UrlGuardError);
    await expect(guardUrl("http://192.168.1.10/")).rejects.toBeInstanceOf(UrlGuardError);
  });

  it("accepts a public hostname", async () => {
    const safe = await guardUrl("https://example.com/path?q=1#hash");
    expect(safe.hostname).toBe("example.com");
    expect(safe.href).toBe("https://example.com/path?q=1");
    expect(safe.resolvedIps.length).toBeGreaterThan(0);
  });
});
