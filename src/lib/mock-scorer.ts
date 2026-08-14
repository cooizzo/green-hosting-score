import { normalizeRating } from "@/lib/rating";

export type MeasureMode = "fast" | "accurate";

export type ScoreResult = {
  bytes: number;
  green: boolean;
  gco2e: number;
  rating: string;
  cleanerThan: number | null;
  gridLabel: string | null;
  gridIntensity: number | null;
  fixes: string[];
  mocked: boolean;
};

function ratingFromBytes(bytes: number, green: boolean): string {
  // Rough Digital Carbon Rating-ish mapping for mock mode
  const adjusted = green ? bytes * 0.7 : bytes;
  if (adjusted < 300_000) return "A+";
  if (adjusted < 500_000) return "A";
  if (adjusted < 1_000_000) return "B";
  if (adjusted < 1_500_000) return "C";
  if (adjusted < 2_500_000) return "D";
  if (adjusted < 4_000_000) return "E";
  return "F";
}

function gco2eFromBytes(bytes: number, green: boolean): number {
  // Simplified stand-in until Website Carbon /data is wired
  const kwhPerByte = 0.00000000081;
  const gridFactor = green ? 0.288 : 0.442;
  return bytes * kwhPerByte * gridFactor * 1000; // grams
}

export function mockBytesForUrl(url: string, mode: MeasureMode): number {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  const base = 400_000 + (h % 3_500_000);
  return mode === "accurate" ? Math.round(base * 1.15) : base;
}

export function mockFixes(bytes: number): string[] {
  const fixes: string[] = [];
  if (bytes > 2_000_000) fixes.push("Compress or resize large images — they dominate transfer size.");
  if (bytes > 1_000_000) fixes.push("Defer non-critical third-party scripts until after first paint.");
  fixes.push("Enable Brotli/Gzip compression on HTML, CSS, and JS.");
  if (fixes.length < 3) {
    fixes.push("Prefer system or subsetted fonts to cut font payload.");
  }
  return fixes.slice(0, 3);
}

/**
 * Phase 0 mock scorer — deterministic stand-in for measure + carbon APIs.
 * Set MOCK_SCORER=true to skip Greencheck / Website Carbon.
 */
export function mockScore(url: string, mode: MeasureMode): ScoreResult {
  const bytes = mockBytesForUrl(url, mode);
  const green = /green|eco|sustain/i.test(url) || bytes % 5 === 0;
  const gco2e = Number(gco2eFromBytes(bytes, green).toFixed(4));
  const rating = ratingFromBytes(bytes, green);
  const cleanerThan = Math.max(0.05, Math.min(0.95, 1 - bytes / 5_000_000));

  return {
    bytes,
    green,
    gco2e,
    rating: normalizeRating(rating, gco2e),
    cleanerThan: Number(cleanerThan.toFixed(2)),
    gridLabel: green ? "cleaner-than-average" : "average",
    gridIntensity: green ? 180 : 320,
    fixes: mockFixes(bytes),
    mocked: true,
  };
}
