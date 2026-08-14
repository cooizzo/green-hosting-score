import { fetchJson } from "@/lib/http";
import { logger } from "@/lib/logger";

const GRID_URL = "https://api.thegreenwebfoundation.org/api/v3/ip-to-co2intensity/";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type GridLabel = "clean" | "average" | "dirty";

export type GridContext = {
  label: GridLabel;
  intensity: number;
  country: string | null;
  fossilPct: number | null;
};

type CacheEntry = { expiresAt: number; value: GridContext };
const cache = new Map<string, CacheEntry>();

type IpToCo2Response = {
  country_name?: unknown;
  carbon_intensity?: unknown;
  generation_from_fossil?: unknown;
};

export function clearGridCache(): void {
  cache.clear();
}

export function labelFromIntensity(gPerKwh: number, fossilPct: number | null): GridLabel {
  if (fossilPct != null) {
    if (fossilPct < 35 && gPerKwh < 350) return "clean";
    if (fossilPct > 70 || gPerKwh > 520) return "dirty";
  }
  if (gPerKwh < 300) return "clean";
  if (gPerKwh > 500) return "dirty";
  return "average";
}

export function formatGridLabel(ctx: GridContext): string {
  const place = ctx.country && ctx.country.toLowerCase() !== "world" ? ` · ${ctx.country}` : "";
  return `${ctx.label}${place}`;
}

function pickIp(ips: string[]): string | null {
  const v4 = ips.find((ip) => /^\d+\.\d+\.\d+\.\d+$/.test(ip));
  return v4 ?? ips[0] ?? null;
}

export async function gridContext(ips: string[]): Promise<GridContext | null> {
  const ip = pickIp(ips);
  if (!ip) return null;

  const hit = cache.get(ip);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  try {
    const data = await fetchJson<IpToCo2Response>(`${GRID_URL}${encodeURIComponent(ip)}`);
    if (typeof data.carbon_intensity !== "number" || !Number.isFinite(data.carbon_intensity)) {
      throw new Error("IP→CO2 response missing carbon_intensity");
    }
    const fossilPct =
      typeof data.generation_from_fossil === "number" && Number.isFinite(data.generation_from_fossil)
        ? data.generation_from_fossil
        : null;
    const country = typeof data.country_name === "string" ? data.country_name : null;
    const value: GridContext = {
      label: labelFromIntensity(data.carbon_intensity, fossilPct),
      intensity: data.carbon_intensity,
      country,
      fossilPct,
    };
    cache.set(ip, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    return value;
  } catch (err) {
    logger.warn({ err, ip }, "GWF IP→CO2 lookup failed");
    return null;
  }
}
