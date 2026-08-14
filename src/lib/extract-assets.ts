import { load } from "cheerio";

const SKIP_PREFIXES = ["data:", "javascript:", "mailto:", "tel:", "blob:", "#"];

function shouldSkip(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return !v || SKIP_PREFIXES.some((p) => v.startsWith(p));
}

function toAbsolute(raw: string, baseUrl: string): string | null {
  const trimmed = raw.trim();
  if (shouldSkip(trimmed)) return null;
  try {
    const abs = new URL(trimmed, baseUrl);
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return null;
    abs.hash = "";
    return abs.toString();
  } catch {
    return null;
  }
}

/** Last candidate in a srcset is usually the largest (desktop) resource. */
export function parseSrcset(srcset: string): string | null {
  const parts = srcset
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  return last.split(/\s+/)[0] ?? null;
}

export function extractCssUrls(css: string, baseUrl: string): string[] {
  const found = new Set<string>();
  const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const abs = toAbsolute(m[2], baseUrl);
    if (abs) found.add(abs);
  }
  return [...found];
}

export type ExtractedAssets = {
  stylesheets: string[];
  other: string[];
};

/**
 * First-party page-load resources from HTML (not <a href> navigation links).
 */
export function extractAssetUrls(html: string, baseUrl: string): ExtractedAssets {
  const $ = load(html);
  const stylesheets = new Set<string>();
  const other = new Set<string>();

  const addOther = (raw: string | undefined) => {
    if (!raw) return;
    const abs = toAbsolute(raw, baseUrl);
    if (abs) other.add(abs);
  };

  $("link[href]").each((_, el) => {
    const href = $(el).attr("href");
    const rel = ($(el).attr("rel") ?? "").toLowerCase();
    const abs = href ? toAbsolute(href, baseUrl) : null;
    if (!abs) return;
    if (rel.split(/\s+/).includes("stylesheet")) stylesheets.add(abs);
    else other.add(abs);
  });

  $("script[src]").each((_, el) => addOther($(el).attr("src")));
  $("source[src], video[src], audio[src], embed[src], object[data], image[href]").each((_, el) => {
    addOther($(el).attr("src") ?? $(el).attr("data") ?? $(el).attr("href"));
  });

  $("img").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (srcset) addOther(parseSrcset(srcset) ?? undefined);
    else addOther($(el).attr("src"));
  });

  $("source[srcset]").each((_, el) => addOther(parseSrcset($(el).attr("srcset") ?? "") ?? undefined));

  $("style").each((_, el) => {
    for (const u of extractCssUrls($(el).text(), baseUrl)) other.add(u);
  });

  $("[style]").each((_, el) => {
    for (const u of extractCssUrls($(el).attr("style") ?? "", baseUrl)) other.add(u);
  });

  for (const sheet of stylesheets) other.delete(sheet);

  return { stylesheets: [...stylesheets], other: [...other] };
}
