import type { Browser } from "playwright";
import { logger } from "@/lib/logger";
import { measureFast } from "@/lib/measure-fast";
import type { MeasureResult } from "@/lib/measure-types";
import { guardUrl } from "@/lib/url-guard";

const ACCURATE_TIMEOUT_MS = 25_000;
const ACCURATE_MAX_CONCURRENT = 2;
const ACCURATE_MAX_BYTES = 20_000_000;

type GlobalPw = typeof globalThis & { __ghsPlaywright?: Promise<Browser | null> };

let inflight = 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (inflight >= ACCURATE_MAX_CONCURRENT) {
    await sleep(150);
  }
  inflight += 1;
  try {
    return await fn();
  } finally {
    inflight -= 1;
  }
}

async function getBrowser(): Promise<Browser> {
  const g = globalThis as GlobalPw;
  if (!g.__ghsPlaywright) {
    g.__ghsPlaywright = (async () => {
      const { chromium } = await import("playwright");
      return chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });
    })().catch((err) => {
      logger.warn({ err }, "failed to launch Playwright Chromium");
      g.__ghsPlaywright = undefined;
      return null;
    });
  }
  const browser = await g.__ghsPlaywright;
  if (!browser) throw new Error("Playwright Chromium is not available");
  return browser;
}

function isInlineUrl(url: string): boolean {
  return (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("about:") ||
    url.startsWith("chrome:")
  );
}

async function measureWithPlaywright(url: string): Promise<MeasureResult> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    javaScriptEnabled: true,
    ignoreHTTPSErrors: false,
    userAgent: "GreenHostingScore/0.1 (+https://github.com/cooizzo/green-hosting-score)",
  });

  try {
    await context.route("**/*", async (route) => {
      const reqUrl = route.request().url();
      if (isInlineUrl(reqUrl)) {
        await route.continue();
        return;
      }
      try {
        await guardUrl(reqUrl);
        await route.continue();
      } catch {
        await route.abort();
      }
    });

    const page = await context.newPage();
    let bytes = 0;
    let resourceCount = 0;
    let htmlBytes = 0;

    page.on("response", (response) => {
      try {
        const reqUrl = response.url();
        if (isInlineUrl(reqUrl)) return;
        const headers = response.headers();
        const cl = Number(headers["content-length"]);
        const size = Number.isFinite(cl) && cl > 0 ? cl : 0;
        bytes += size;
        resourceCount += 1;
        if (response.request().resourceType() === "document" && htmlBytes === 0) {
          htmlBytes = size;
        }
      } catch {
        // ignore individual response errors
      }
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: ACCURATE_TIMEOUT_MS });
    await sleep(750);

    // Fill in missing Content-Length via encoded body sizes from the CDP dump when possible.
    const perf = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((e) => {
        const r = e as PerformanceResourceTiming;
        return {
          name: r.name,
          transferSize: r.transferSize,
          encodedBodySize: r.encodedBodySize,
        };
      }),
    );

    const nav = await page.evaluate(() => {
      const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      return entry
        ? { transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize }
        : null;
    });

    let perfTotal = 0;
    if (nav) perfTotal += nav.transferSize || nav.encodedBodySize || 0;
    for (const e of perf) {
      perfTotal += e.transferSize || e.encodedBodySize || 0;
    }

    const measured = Math.max(bytes, perfTotal);
    if (measured < 1) {
      throw new Error("no transfer sizes recorded");
    }

    return {
      bytes: Math.min(ACCURATE_MAX_BYTES, Math.round(measured)),
      htmlBytes: htmlBytes || nav?.encodedBodySize || 0,
      resourceCount: Math.max(resourceCount, perf.length + (nav ? 1 : 0)),
      mode: "accurate",
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

/**
 * Real transfer size via Chromium. Falls back to fast crawl if Playwright is unavailable.
 */
export async function measureAccurate(url: string): Promise<MeasureResult> {
  return withSlot(async () => {
    try {
      return await measureWithPlaywright(url);
    } catch (err) {
      logger.warn({ err, url }, "accurate measurement failed; falling back to fast crawl");
      const fast = await measureFast(url);
      return { ...fast, mode: "accurate" };
    }
  });
}
