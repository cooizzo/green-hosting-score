import { checkGreenSafe } from "@/lib/greencheck";
import { measurePage } from "@/lib/measure";
import { mockFixes, type MeasureMode, type ScoreResult } from "@/lib/mock-scorer";
import { scoreEmissions } from "@/lib/score-emissions";

/**
 * Live scorer: measure transfer bytes, then Greencheck + Website Carbon /data.
 */
export async function liveScore(url: string, hostname: string, mode: MeasureMode): Promise<ScoreResult> {
  const measured = await measurePage(url, mode);
  const greenCheck = await checkGreenSafe(hostname);
  const emissions = await scoreEmissions(measured.bytes, greenCheck.green);

  return {
    bytes: measured.bytes,
    green: greenCheck.green,
    gco2e: emissions.gco2e,
    rating: emissions.rating,
    cleanerThan: emissions.cleanerThan,
    gridLabel: null,
    gridIntensity: null,
    fixes: mockFixes(measured.bytes),
    mocked: false,
  };
}
