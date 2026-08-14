import { measureAccurate } from "@/lib/measure-accurate";
import { measureFast } from "@/lib/measure-fast";
import type { MeasureResult } from "@/lib/measure-types";
import type { MeasureMode } from "@/lib/mock-scorer";

export async function measurePage(url: string, mode: MeasureMode): Promise<MeasureResult> {
  if (mode === "accurate") return measureAccurate(url);
  return measureFast(url);
}

export type { MeasureResult } from "@/lib/measure-types";
