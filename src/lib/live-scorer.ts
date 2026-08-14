import { checkGreenSafe } from "@/lib/greencheck";
import { mockBytesForUrl, mockFixes, type MeasureMode, type ScoreResult } from "@/lib/mock-scorer";
import { scoreEmissions } from "@/lib/score-emissions";

/**
 * Phase 1 live scorer: Greencheck + Website Carbon /data (CO2.js fallback).
 * Transfer bytes stay estimated until Phase 2 crawl / Playwright.
 */
export async function liveScore(url: string, hostname: string, mode: MeasureMode): Promise<ScoreResult> {
  const bytes = mockBytesForUrl(url, mode);
  const greenCheck = await checkGreenSafe(hostname);
  const emissions = await scoreEmissions(bytes, greenCheck.green);

  return {
    bytes,
    green: greenCheck.green,
    gco2e: emissions.gco2e,
    rating: emissions.rating,
    cleanerThan: emissions.cleanerThan,
    gridLabel: null,
    gridIntensity: null,
    fixes: mockFixes(bytes),
    mocked: false,
  };
}
