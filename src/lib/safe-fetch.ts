import { USER_AGENT } from "@/lib/http";
import { UrlGuardError, guardUrl } from "@/lib/url-guard";

const MAX_REDIRECTS = 5;

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  /** true = always read body; auto = Content-Length if present, else body */
  readBody?: boolean | "auto";
};

export type SafeResponse = {
  href: string;
  status: number;
  headers: Headers;
  body: Buffer | null;
  bytes: number;
};

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function readCapped(res: Response, maxBytes: number): Promise<Buffer> {
  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.subarray(0, Math.min(buf.byteLength, maxBytes));
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const next = total + value.byteLength;
    if (next > maxBytes) {
      chunks.push(value.subarray(0, maxBytes - total));
      await reader.cancel().catch(() => undefined);
      total = maxBytes;
      break;
    }
    chunks.push(value);
    total = next;
  }
  return Buffer.concat(chunks, total);
}

function declaredLength(headers: Headers): number | null {
  const raw = headers.get("content-length");
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Fetch a URL after SSRF checks. Redirects are re-validated; private hop targets are rejected.
 */
export async function safeFetch(input: string, opts: SafeFetchOptions = {}): Promise<SafeResponse> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxBytes = opts.maxBytes ?? 2_000_000;
  const readBody = opts.readBody ?? true;

  let current = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = await guardUrl(current);
    let res: Response;
    try {
      res = await fetch(safe.href, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
        headers: { "user-agent": USER_AGENT, accept: "*/*" },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "network error";
      throw new Error(`Could not fetch URL: ${reason}`);
    }

    if (isRedirect(res.status)) {
      await res.body?.cancel().catch(() => undefined);
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect missing Location header");
      try {
        current = new URL(loc, safe.href).toString();
      } catch {
        throw new Error("Redirect Location is not a valid URL");
      }
      continue;
    }

    const declared = declaredLength(res.headers);
    const useLengthOnly =
      readBody === false || (readBody === "auto" && declared != null);

    if (useLengthOnly) {
      await res.body?.cancel().catch(() => undefined);
      const bytes = Math.min(declared ?? 0, maxBytes);
      return { href: safe.href, status: res.status, headers: res.headers, body: null, bytes };
    }

    const body = await readCapped(res, maxBytes);
    const bytes = declared != null ? Math.min(declared, maxBytes) : body.byteLength;
    return { href: safe.href, status: res.status, headers: res.headers, body, bytes };
  }

  throw new UrlGuardError("Too many redirects");
}
