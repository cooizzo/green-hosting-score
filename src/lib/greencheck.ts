import { fetchJson } from "@/lib/http";
import { logger } from "@/lib/logger";

const GREENCHECK_BASE = "https://api.thegreenwebfoundation.org/api/v3/greencheck/";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type GreenCheckResult = {
  green: boolean;
  hostname: string;
  hostedBy: string | null;
};

type CacheEntry = { expiresAt: number; value: GreenCheckResult };

const cache = new Map<string, CacheEntry>();

type GreencheckResponse = {
  green?: unknown;
  url?: unknown;
  hosted_by?: unknown;
};

export function clearGreenCache(): void {
  cache.clear();
}

/**
 * Check whether a hostname is in the Green Web Foundation dataset.
 * Failures return not-green (conservative) rather than aborting analysis.
 */
export async function checkGreen(hostname: string): Promise<GreenCheckResult> {
  const key = hostname.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }

  const url = `${GREENCHECK_BASE}${encodeURIComponent(key)}`;
  const data = await fetchJson<GreencheckResponse>(url);
  const value: GreenCheckResult = {
    green: data.green === true,
    hostname: typeof data.url === "string" ? data.url : key,
    hostedBy: typeof data.hosted_by === "string" ? data.hosted_by : null,
  };
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}

export async function checkGreenSafe(hostname: string): Promise<GreenCheckResult> {
  try {
    return await checkGreen(hostname);
  } catch (err) {
    logger.warn({ err, hostname }, "greencheck failed; assuming not green");
    return { green: false, hostname, hostedBy: null };
  }
}
