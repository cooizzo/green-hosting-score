import { extractAssetUrls, extractCssUrls } from "@/lib/extract-assets";
import { logger } from "@/lib/logger";
import { safeFetch } from "@/lib/safe-fetch";
import { UrlGuardError } from "@/lib/url-guard";
import type { MeasureResult } from "@/lib/measure-types";

export const FAST_HTML_TIMEOUT_MS = 10_000;
export const FAST_ASSET_TIMEOUT_MS = 8_000;
export const FAST_MAX_HTML_BYTES = 2_000_000;
export const FAST_MAX_ASSET_BYTES = 5_000_000;
export const FAST_MAX_TOTAL_BYTES = 20_000_000;
export const FAST_MAX_ASSETS = 80;
export const FAST_ASSET_CONCURRENCY = 8;

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (!items.length) return [];
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

async function sizeOf(url: string, readBody: boolean | "auto"): Promise<{ bytes: number; body: Buffer | null }> {
  try {
    const res = await safeFetch(url, {
      timeoutMs: FAST_ASSET_TIMEOUT_MS,
      maxBytes: FAST_MAX_ASSET_BYTES,
      readBody,
    });
    return { bytes: res.bytes, body: res.body };
  } catch (err) {
    if (err instanceof UrlGuardError) {
      logger.warn({ url, err }, "skipped unsafe or failed asset");
    } else {
      logger.warn({ url, err }, "asset fetch failed");
    }
    return { bytes: 0, body: null };
  }
}

/**
 * Estimate page-load transfer: HTML + linked assets (and one level of CSS url()).
 */
export async function measureFast(url: string): Promise<MeasureResult> {
  const htmlRes = await safeFetch(url, {
    timeoutMs: FAST_HTML_TIMEOUT_MS,
    maxBytes: FAST_MAX_HTML_BYTES,
    readBody: true,
  });
  if (!htmlRes.body || htmlRes.status >= 400) {
    throw new Error(`Could not load page (HTTP ${htmlRes.status})`);
  }

  const html = htmlRes.body.toString("utf8");
  const extracted = extractAssetUrls(html, htmlRes.href);

  let total = htmlRes.bytes;
  const seen = new Set<string>([htmlRes.href]);
  let resourceCount = 1;

  const stylesheets = extracted.stylesheets.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  const extras: string[] = [];

  await mapPool(stylesheets.slice(0, FAST_MAX_ASSETS), FAST_ASSET_CONCURRENCY, async (href) => {
    if (total >= FAST_MAX_TOTAL_BYTES) return;
    const { bytes, body } = await sizeOf(href, true);
    total = Math.min(FAST_MAX_TOTAL_BYTES, total + bytes);
    resourceCount += 1;
    if (body) {
      for (const cssUrl of extractCssUrls(body.toString("utf8"), href)) {
        extras.push(cssUrl);
      }
    }
  });

  const rest = [...extracted.other, ...extras].filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  const remainingSlots = Math.max(0, FAST_MAX_ASSETS - stylesheets.length);
  await mapPool(rest.slice(0, remainingSlots), FAST_ASSET_CONCURRENCY, async (href) => {
    if (total >= FAST_MAX_TOTAL_BYTES) return;
    const { bytes } = await sizeOf(href, "auto");
    total = Math.min(FAST_MAX_TOTAL_BYTES, total + bytes);
    resourceCount += 1;
  });

  return {
    bytes: Math.max(1, Math.round(total)),
    htmlBytes: htmlRes.bytes,
    resourceCount,
    mode: "fast",
  };
}
