import { extractAssetUrls, extractCssUrls } from "@/lib/extract-assets";
import { logger } from "@/lib/logger";
import {
  classifyResource,
  emptyHints,
  isCompressedEncoding,
  isThirdPartyHost,
  type MeasureResult,
} from "@/lib/measure-types";
import { safeFetch } from "@/lib/safe-fetch";
import { UrlGuardError } from "@/lib/url-guard";

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

type Sized = {
  bytes: number;
  body: Buffer | null;
  href: string;
  contentType: string | null;
};

type HintAcc = {
  largestImageBytes: number;
  imageBytes: number;
  scriptBytes: number;
  thirdPartyBytes: number;
  thirdPartyHosts: Set<string>;
};

function noteResource(acc: HintAcc, pageHost: string, href: string, bytes: number, contentType: string | null) {
  if (bytes <= 0) return;
  const kind = classifyResource(href, contentType);
  if (kind === "image") {
    acc.imageBytes += bytes;
    if (bytes > acc.largestImageBytes) acc.largestImageBytes = bytes;
  }
  if (kind === "script") acc.scriptBytes += bytes;
  try {
    const host = new URL(href).hostname;
    if (isThirdPartyHost(host, pageHost)) {
      acc.thirdPartyBytes += bytes;
      acc.thirdPartyHosts.add(host);
    }
  } catch {
    // ignore invalid URL
  }
}

async function sizeOf(url: string, readBody: boolean | "auto"): Promise<Sized> {
  try {
    const res = await safeFetch(url, {
      timeoutMs: FAST_ASSET_TIMEOUT_MS,
      maxBytes: FAST_MAX_ASSET_BYTES,
      readBody,
    });
    return {
      bytes: res.bytes,
      body: res.body,
      href: res.href,
      contentType: res.headers.get("content-type"),
    };
  } catch (err) {
    if (err instanceof UrlGuardError) {
      logger.warn({ url, err }, "skipped unsafe or failed asset");
    } else {
      logger.warn({ url, err }, "asset fetch failed");
    }
    return { bytes: 0, body: null, href: url, contentType: null };
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
  let pageHost = "";
  try {
    pageHost = new URL(htmlRes.href).hostname;
  } catch {
    pageHost = "";
  }

  const hints: HintAcc = {
    largestImageBytes: 0,
    imageBytes: 0,
    scriptBytes: 0,
    thirdPartyBytes: 0,
    thirdPartyHosts: new Set(),
  };

  let total = htmlRes.bytes;
  const seen = new Set<string>([htmlRes.href]);
  let resourceCount = 1;

  const stylesheets = extracted.stylesheets.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });

  const extras: string[] = [];

  await mapPool(stylesheets.slice(0, FAST_MAX_ASSETS), FAST_ASSET_CONCURRENCY, async (sheetUrl) => {
    if (total >= FAST_MAX_TOTAL_BYTES) return;
    const sized = await sizeOf(sheetUrl, true);
    total = Math.min(FAST_MAX_TOTAL_BYTES, total + sized.bytes);
    resourceCount += 1;
    noteResource(hints, pageHost, sized.href, sized.bytes, sized.contentType);
    if (sized.body) {
      for (const cssUrl of extractCssUrls(sized.body.toString("utf8"), sized.href)) {
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
    const sized = await sizeOf(href, "auto");
    total = Math.min(FAST_MAX_TOTAL_BYTES, total + sized.bytes);
    resourceCount += 1;
    noteResource(hints, pageHost, sized.href, sized.bytes, sized.contentType);
  });

  return {
    bytes: Math.max(1, Math.round(total)),
    htmlBytes: htmlRes.bytes,
    resourceCount,
    mode: "fast",
    ...emptyHints(pageHost),
    largestImageBytes: hints.largestImageBytes,
    imageBytes: hints.imageBytes,
    scriptBytes: hints.scriptBytes,
    thirdPartyBytes: hints.thirdPartyBytes,
    thirdPartyCount: hints.thirdPartyHosts.size,
    htmlCompressed: isCompressedEncoding(htmlRes.headers.get("content-encoding")),
  };
}
