export type MeasureResult = {
  bytes: number;
  htmlBytes: number;
  resourceCount: number;
  mode: "fast" | "accurate";
  pageHost: string;
  largestImageBytes: number;
  imageBytes: number;
  scriptBytes: number;
  thirdPartyBytes: number;
  thirdPartyCount: number;
  htmlCompressed: boolean | null;
};

export function emptyHints(pageHost = ""): Pick<
  MeasureResult,
  | "pageHost"
  | "largestImageBytes"
  | "imageBytes"
  | "scriptBytes"
  | "thirdPartyBytes"
  | "thirdPartyCount"
  | "htmlCompressed"
> {
  return {
    pageHost,
    largestImageBytes: 0,
    imageBytes: 0,
    scriptBytes: 0,
    thirdPartyBytes: 0,
    thirdPartyCount: 0,
    htmlCompressed: null,
  };
}

export function isCompressedEncoding(value: string | null | undefined): boolean {
  if (!value) return false;
  return /gzip|br|deflate|zstd/i.test(value);
}

export function classifyResource(url: string, contentType?: string | null): "image" | "script" | "font" | "css" | "html" | "other" {
  const ct = (contentType ?? "").toLowerCase();
  if (ct.includes("image/") || /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico)(\?|$)/i.test(url)) return "image";
  if (ct.includes("javascript") || /\.(m?js)(\?|$)/i.test(url)) return "script";
  if (ct.includes("font") || /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return "font";
  if (ct.includes("css") || /\.css(\?|$)/i.test(url)) return "css";
  if (ct.includes("html")) return "html";
  return "other";
}

export function isThirdPartyHost(assetHost: string, pageHost: string): boolean {
  const a = assetHost.toLowerCase();
  const p = pageHost.toLowerCase();
  if (!a || !p) return false;
  return a !== p && !a.endsWith(`.${p}`);
}
