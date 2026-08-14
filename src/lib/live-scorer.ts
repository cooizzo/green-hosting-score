import { checkGreenSafe } from "@/lib/greencheck";
import { formatGridLabel, gridContext } from "@/lib/grid-context";
import { measurePage } from "@/lib/measure";
import type { MeasureMode, ScoreResult } from "@/lib/mock-scorer";
import { scoreEmissions } from "@/lib/score-emissions";
import { suggestFixes } from "@/lib/suggest-fixes";

/**
 * Live scorer: measure transfer bytes, then Greencheck + Website Carbon /data + grid footnote.
 */
export async function liveScore(
  url: string,
  hostname: string,
  mode: MeasureMode,
  resolvedIps: string[] = [],
): Promise<ScoreResult> {
  const measured = await measurePage(url, mode);
  const [greenCheck, grid] = await Promise.all([
    checkGreenSafe(hostname),
    gridContext(resolvedIps),
  ]);
  const emissions = await scoreEmissions(measured.bytes, greenCheck.green);

  return {
    bytes: measured.bytes,
    green: greenCheck.green,
    gco2e: emissions.gco2e,
    rating: emissions.rating,
    cleanerThan: emissions.cleanerThan,
    gridLabel: grid ? formatGridLabel(grid) : null,
    gridIntensity: grid?.intensity ?? null,
    fixes: suggestFixes(measured),
    mocked: false,
  };
}
