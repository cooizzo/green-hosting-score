import { co2 } from "@tgwf/co2";
import { fetchJson } from "@/lib/http";
import { logger } from "@/lib/logger";
import { normalizeRating, type LetterRating } from "@/lib/rating";

export type EmissionsSource = "websitecarbon" | "co2js";

export type EmissionsScore = {
  gco2e: number;
  rating: LetterRating;
  cleanerThan: number | null;
  source: EmissionsSource;
};

type WebsiteCarbonResponse = {
  gco2e?: unknown;
  rating?: unknown;
  cleanerThan?: unknown;
};

const calculator = new co2({ model: "swd", rating: true });

async function scoreViaWebsiteCarbon(bytes: number, green: boolean): Promise<EmissionsScore> {
  const url = `https://api.websitecarbon.com/data?bytes=${Math.max(0, Math.round(bytes))}&green=${green ? 1 : 0}`;
  const data = await fetchJson<WebsiteCarbonResponse>(url);
  if (typeof data.gco2e !== "number" || !Number.isFinite(data.gco2e)) {
    throw new Error("Website Carbon response missing gco2e");
  }
  const cleanerThan =
    typeof data.cleanerThan === "number" && Number.isFinite(data.cleanerThan) ? data.cleanerThan : null;
  return {
    gco2e: data.gco2e,
    rating: normalizeRating(data.rating, data.gco2e),
    cleanerThan,
    source: "websitecarbon",
  };
}

function gramsFromCo2js(raw: number | { total: number; rating?: string }): number {
  if (typeof raw === "number") return raw;
  if (raw && typeof raw.total === "number") return raw.total;
  throw new Error("CO2.js returned a non-numeric estimate");
}

function scoreViaCo2js(bytes: number, green: boolean): EmissionsScore {
  const raw = calculator.perVisit(bytes, green);
  const gco2e = gramsFromCo2js(raw);
  if (!Number.isFinite(gco2e)) {
    throw new Error("CO2.js returned a non-numeric estimate");
  }
  const ratingHint = typeof raw === "object" && raw ? raw.rating : undefined;
  return {
    gco2e,
    rating: normalizeRating(ratingHint, gco2e),
    cleanerThan: null,
    source: "co2js",
  };
}

/**
 * Website Carbon /data first; CO2.js (SWDM) if that request fails.
 */
export async function scoreEmissions(bytes: number, green: boolean): Promise<EmissionsScore> {
  try {
    return await scoreViaWebsiteCarbon(bytes, green);
  } catch (err) {
    logger.warn({ err, bytes, green }, "Website Carbon /data failed; using CO2.js");
    return scoreViaCo2js(bytes, green);
  }
}
