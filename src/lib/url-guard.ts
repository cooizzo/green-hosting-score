import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class UrlGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlGuardError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

const DNS_TTL_MS = 60_000;
const dnsCache = new Map<string, { expiresAt: number; ips: string[] }>();

export function clearDnsCache(): void {
  dnsCache.clear();
}

function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "0.0.0.0") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;

  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export type SafeUrl = {
  href: string;
  hostname: string;
  resolvedIps: string[];
};

/**
 * Validate and normalize a user-supplied URL for outbound fetching (SSRF-safe).
 */
export async function guardUrl(input: string): Promise<SafeUrl> {
  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    throw new UrlGuardError("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlGuardError("Only http and https URLs are allowed");
  }

  if (parsed.username || parsed.password) {
    throw new UrlGuardError("URLs with credentials are not allowed");
  }

  const hostname = parsed.hostname.replace(/\.$/, "").toLowerCase();
  if (!hostname) {
    throw new UrlGuardError("Hostname is required");
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UrlGuardError("Hostname is not allowed");
  }

  if (hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UrlGuardError("Hostname is not allowed");
  }

  const resolvedIps: string[] = [];

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new UrlGuardError("Private or local IP addresses are not allowed");
    }
    resolvedIps.push(hostname);
  } else {
    const cached = dnsCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      resolvedIps.push(...cached.ips);
    } else {
      let records: { address: string; family: number }[];
      try {
        records = await lookup(hostname, { all: true, verbatim: true });
      } catch {
        throw new UrlGuardError("Could not resolve hostname");
      }
      if (!records.length) {
        throw new UrlGuardError("Could not resolve hostname");
      }
      for (const r of records) {
        if (isPrivateIp(r.address)) {
          throw new UrlGuardError("Hostname resolves to a private or local address");
        }
        resolvedIps.push(r.address);
      }
      dnsCache.set(hostname, { expiresAt: Date.now() + DNS_TTL_MS, ips: [...resolvedIps] });
    }
  }

  // Normalize: drop hash, keep search
  parsed.hash = "";
  return {
    href: parsed.toString(),
    hostname,
    resolvedIps,
  };
}
